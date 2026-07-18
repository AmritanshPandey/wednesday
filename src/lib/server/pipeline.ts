import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { FIRESTORE_BATCH_LIMIT, PIPELINE_CHUNK } from "@/lib/server/config";
import {
  getActiveUsers,
  getExistingRankingIds,
  getPools,
  getRankings,
  markWeekStatus,
  poolAndRankingDocs,
  writeOutcomes
} from "@/lib/server/data";
import { freezeSnapshots, getSnapshots } from "@/lib/server/snapshot";
import { checkMarketGate, computeMetrics, writeMetrics } from "@/lib/server/market";
import { validateOutcomes } from "@/lib/server/validate";
import { allocateWeek, type MatchOutcome } from "@/lib/server/allocate";
import {
  PIPELINE_STAGES,
  type JobDoc,
  type PipelineStage,
  type SnapshotDoc,
  type StageState,
  type UserDoc,
  type ValidationDoc
} from "@/lib/app/types";

// Leave headroom under Vercel's 60s function cap; on hitting it a stage
// checkpoints its cursor and a re-invocation resumes exactly where it stopped.
const STAGE_BUDGET_MS = 45_000;

export type StageResult = { stage: PipelineStage; done: boolean; cursor: number; note?: string };

function systemDoc(weekId: string, name: string) {
  return adminDb().collection("weeks").doc(weekId).collection("system").doc(name);
}

function emptyStage(): StageState {
  return { status: "pending", cursor: 0, startedAt: null, finishedAt: null, error: null };
}

export async function getJob(weekId: string): Promise<JobDoc | null> {
  const snap = await systemDoc(weekId, "job").get();
  return snap.exists ? (snap.data() as JobDoc) : null;
}

async function loadOrInitJob(weekId: string): Promise<JobDoc> {
  return (
    (await getJob(weekId)) ?? {
      weekId,
      status: "collecting",
      stages: { pools: emptyStage(), freeze: emptyStage(), allocate: emptyStage() },
      updatedAt: Date.now()
    }
  );
}

async function saveJob(job: JobDoc): Promise<void> {
  job.updatedAt = Date.now();
  await systemDoc(job.weekId, "job").set(job);
}

/** Minimal UserDoc synthesised from an immutable snapshot — the ONLY profile
 *  source allocation sees, so a mid-week edit can never shift a match. */
function participantFromSnapshot(s: SnapshotDoc): UserDoc {
  return {
    uid: s.uid,
    email: null,
    displayName: null,
    photoURL: null,
    profile: s.profile,
    preferences: s.preferences,
    setupComplete: true,
    setupStepReached: 12,
    joinedWeekId: s.weekId,
    createdAt: 0,
    updatedAt: 0
  };
}

/** weekId is a YYYY-MM-DD reveal date; the next cycle is exactly 7 days on. */
function nextWeekId(weekId: string): string {
  const [y, m, d] = weekId.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 7));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

// ── Stage: pools ──────────────────────────────────────────────────────────
// Build every active user's candidate pool for the ranking window. Chunked +
// resumable. At cursor 0 it also writes metrics and applies the thin-market
// gate — a starved week rolls forward instead of manufacturing weak matches.
async function runPools(weekId: string, job: JobDoc): Promise<StageResult> {
  const users = await getActiveUsers(weekId);
  const db = adminDb();

  if (job.stages.pools.cursor === 0) {
    await writeMetrics(computeMetrics(weekId, users));
    const gate = checkMarketGate(users);
    if (!gate.ok) {
      // Carry everyone to next week so nobody is stranded, and stop the pipeline.
      const nw = nextWeekId(weekId);
      let batch = db.batch();
      let ops = 0;
      for (const u of users) {
        batch.update(db.collection("users").doc(u.uid), { activeWeekId: nw, updatedAt: Date.now() });
        if (++ops >= FIRESTORE_BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
      if (ops) await batch.commit();
      job.status = "rolled_forward";
      await markWeekStatus(weekId, "rolled_forward");
      return { stage: "pools", done: true, cursor: users.length, note: `rolled forward: ${gate.reason}` };
    }
  }

  const existingRankings = await getExistingRankingIds(weekId);
  const poolsCol = db.collection("weeks").doc(weekId).collection("pools");
  const rankingsCol = db.collection("weeks").doc(weekId).collection("rankings");
  let cursor = job.stages.pools.cursor;
  const start = Date.now();

  while (cursor < users.length && Date.now() - start < STAGE_BUDGET_MS) {
    const slice = users.slice(cursor, cursor + PIPELINE_CHUNK);
    let batch = db.batch();
    let ops = 0;
    for (const me of slice) {
      const others = users.filter((u) => u.uid !== me.uid);
      const { pool, ranking } = poolAndRankingDocs(weekId, me, others, existingRankings.has(me.uid));
      batch.set(poolsCol.doc(me.uid), pool);
      ops += 1;
      if (ranking) {
        batch.set(rankingsCol.doc(me.uid), ranking);
        ops += 1;
      }
      if (ops >= FIRESTORE_BATCH_LIMIT - 1) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (ops) await batch.commit();
    cursor += slice.length;
    job.stages.pools.cursor = cursor;
    await saveJob(job);
  }

  return { stage: "pools", done: cursor >= users.length, cursor };
}

// ── Stage: freeze ─────────────────────────────────────────────────────────
// Snapshot active users at the Tuesday deadline. Chunked + resumable; the
// hash dirty-check inside freezeSnapshots skips unchanged docs.
async function runFreeze(weekId: string, job: JobDoc): Promise<StageResult> {
  const users = await getActiveUsers(weekId);
  let cursor = job.stages.freeze.cursor;
  const start = Date.now();
  while (cursor < users.length && Date.now() - start < STAGE_BUDGET_MS) {
    const slice = users.slice(cursor, cursor + PIPELINE_CHUNK);
    await freezeSnapshots(weekId, slice);
    cursor += slice.length;
    job.stages.freeze.cursor = cursor;
    await saveJob(job);
  }
  return { stage: "freeze", done: cursor >= users.length, cursor };
}

async function updateNoMatchCounters(weekId: string, outcomes: MatchOutcome[]): Promise<void> {
  const db = adminDb();
  let batch = db.batch();
  let ops = 0;
  for (const o of outcomes) {
    const ref = db.collection("users").doc(o.uid);
    const matched = o.status === "revealed";
    batch.set(
      ref,
      { consecutiveNoMatchWeeks: matched ? 0 : FieldValue.increment(1), lastOutcomeWeek: weekId, updatedAt: Date.now() },
      { merge: true }
    );
    if (++ops >= FIRESTORE_BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops) await batch.commit();
}

// ── Stage: allocate (compute → validate → publish, gated) ─────────────────
// Deterministic and single-shot. Nothing is published unless every safety
// check passes, so a re-run is idempotent and a failure leaves no partial
// state. Inputs are sorted by uid so two runs produce byte-identical output.
async function runAllocate(weekId: string, job: JobDoc): Promise<StageResult> {
  const [snapshots, pools, rankings] = await Promise.all([getSnapshots(weekId), getPools(weekId), getRankings(weekId)]);
  const participants = [...snapshots.values()]
    .sort((a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
    .map(participantFromSnapshot);

  const outcomes = allocateWeek(weekId, participants, pools, rankings);
  const report: ValidationDoc = validateOutcomes(weekId, outcomes, snapshots);
  await systemDoc(weekId, "validation").set(report);

  if (!report.passed) {
    const failed = report.checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
    throw new Error(`allocation validation failed: ${failed}`);
  }

  await writeOutcomes(weekId, outcomes);
  await updateNoMatchCounters(weekId, outcomes);
  job.status = "revealed";
  await markWeekStatus(weekId, "revealed");
  return { stage: "allocate", done: true, cursor: participants.length };
}

const STAGE_FNS: Record<PipelineStage, (weekId: string, job: JobDoc) => Promise<StageResult>> = {
  pools: runPools,
  freeze: runFreeze,
  allocate: runAllocate
};

/** Run one stage, resuming from its checkpoint. Marks state, catches errors
 *  into the job doc (so a failed run is visible and retriable), and enforces
 *  stage ordering. Safe to invoke repeatedly — each call is idempotent. */
export async function runStage(weekId: string, stage: PipelineStage): Promise<StageResult> {
  const job = await loadOrInitJob(weekId);

  // Enforce ordering: a stage can't run until its predecessor is done.
  const idx = PIPELINE_STAGES.indexOf(stage);
  for (let i = 0; i < idx; i += 1) {
    if (job.stages[PIPELINE_STAGES[i]].status !== "done") {
      return { stage, done: false, cursor: job.stages[stage].cursor, note: `waiting on ${PIPELINE_STAGES[i]}` };
    }
  }
  if (job.stages[stage].status === "done") return { stage, done: true, cursor: job.stages[stage].cursor };
  if (job.status === "rolled_forward") return { stage, done: true, cursor: 0, note: "week rolled forward" };

  job.status = "running";
  job.stages[stage].status = "running";
  if (job.stages[stage].startedAt === null) job.stages[stage].startedAt = Date.now();
  job.stages[stage].error = null;
  await saveJob(job);

  try {
    const result = await STAGE_FNS[stage](weekId, job);
    job.stages[stage].cursor = result.cursor;
    if (result.done) {
      // A rolled-forward week still marks the stage done; runStage short-circuits
      // later stages via the job.status check, so nothing else runs.
      job.stages[stage].status = "done";
      job.stages[stage].finishedAt = Date.now();
    }
    await saveJob(job);
    return result;
  } catch (err) {
    job.stages[stage].status = "failed";
    job.stages[stage].error = err instanceof Error ? err.message : String(err);
    job.status = "failed";
    await saveJob(job);
    throw err;
  }
}

/** Drive a stage to completion across multiple resumable passes — used by the
 *  manual admin trigger and by the dev tools. Crons call runStage once each. */
export async function runStageToCompletion(weekId: string, stage: PipelineStage, maxPasses = 50): Promise<StageResult> {
  let last: StageResult = { stage, done: false, cursor: 0 };
  for (let pass = 0; pass < maxPasses; pass += 1) {
    last = await runStage(weekId, stage);
    if (last.done) break;
  }
  return last;
}
