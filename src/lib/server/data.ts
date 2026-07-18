import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { buildPoolFor } from "@/lib/server/pool";
import type { MatchOutcome } from "@/lib/server/allocate";
import type { PoolDoc, RankingDoc, UserDoc } from "@/lib/app/types";

/** Verify a Firebase ID token from an Authorization: Bearer header. */
export async function uidFromRequest(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function getJoinedUsers(weekId: string): Promise<UserDoc[]> {
  const snap = await adminDb().collection("users").where("joinedWeekId", "==", weekId).get();
  return snap.docs.map((d) => d.data() as UserDoc);
}

/** The batch pipeline's canonical roster: everyone marked active for the week.
 *  Falls back to the legacy joinedWeekId query for docs written before the
 *  status flag existed, so migration is seamless. */
export async function getActiveUsers(weekId: string): Promise<UserDoc[]> {
  const byStatus = await adminDb()
    .collection("users")
    .where("status", "==", "active")
    .where("activeWeekId", "==", weekId)
    .get();
  if (!byStatus.empty) return byStatus.docs.map((d) => d.data() as UserDoc);
  return getJoinedUsers(weekId);
}

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
}

/** Which ranking docs already exist for a week — so the pool stage seeds a
 *  fresh ranking only for newcomers and never clobbers a user's drag-order. */
export async function getExistingRankingIds(weekId: string): Promise<Set<string>> {
  const snap = await adminDb().collection("weeks").doc(weekId).collection("rankings").select().get();
  return new Set(snap.docs.map((d) => d.id));
}

/** Deal a pool's ids into rounds of five (round-robin, mirroring the client
 *  buildRounds), for a fresh ranking doc. */
function dealRounds(ids: string[]): RankingDoc["rounds"] {
  const roundCount = Math.max(1, Math.ceil(ids.length / 5));
  const buckets: string[][] = Array.from({ length: roundCount }, () => []);
  ids.forEach((id, i) => buckets[i % roundCount].push(id));
  return buckets.map((bucket, i) => ({
    round: i + 1,
    isFinal: false,
    profileIds: bucket,
    rankedOrder: [...bucket],
    submitted: false
  }));
}

/** Pure: build one user's pool doc (+ a fresh ranking doc unless they already
 *  have one). No I/O, so the batched pipeline can compute many then commit in
 *  bulk. `hasRanking` guards against clobbering a user's drag-order. */
export function poolAndRankingDocs(
  weekId: string,
  me: UserDoc,
  others: UserDoc[],
  hasRanking: boolean
): { pool: PoolDoc; ranking: RankingDoc | null } {
  const { entries, allocationTail, candidatesConsidered, passedDealBreakers } = buildPoolFor(me, others);
  const pool: PoolDoc = {
    uid: me.uid,
    weekId,
    entries,
    allocationTail,
    candidatesConsidered,
    passedDealBreakers,
    builtAt: Date.now()
  };
  const ranking: RankingDoc | null = hasRanking
    ? null
    : { uid: me.uid, weekId, rounds: dealRounds(entries.map((e) => e.profileId)), submitted: false, updatedAt: Date.now() };
  return { pool, ranking };
}

/** Legacy single-user pool write (used by the pre-pipeline join path). The
 *  batch pipeline uses poolAndRankingDocs + a bulk commit instead. */
export async function buildAndWritePool(weekId: string, me: UserDoc, others: UserDoc[]): Promise<void> {
  const db = adminDb();
  const rankingRef = db.collection("weeks").doc(weekId).collection("rankings").doc(me.uid);
  const hasRanking = (await rankingRef.get()).exists;
  const { pool, ranking } = poolAndRankingDocs(weekId, me, others, hasRanking);
  await db.collection("weeks").doc(weekId).collection("pools").doc(me.uid).set(pool);
  if (ranking) await rankingRef.set(ranking);
}

export async function getPools(weekId: string): Promise<Map<string, PoolDoc>> {
  const snap = await adminDb().collection("weeks").doc(weekId).collection("pools").get();
  return new Map(snap.docs.map((d) => [d.id, d.data() as PoolDoc]));
}

export async function getRankings(weekId: string): Promise<Map<string, RankingDoc>> {
  const snap = await adminDb().collection("weeks").doc(weekId).collection("rankings").get();
  return new Map(snap.docs.map((d) => [d.id, d.data() as RankingDoc]));
}

/** Persist allocation results as symmetric match docs + thread stubs. */
export async function writeOutcomes(weekId: string, outcomes: MatchOutcome[]): Promise<void> {
  const db = adminDb();
  const batch = db.batch();
  const weekRef = db.collection("weeks").doc(weekId);

  for (const o of outcomes) {
    batch.set(weekRef.collection("matches").doc(o.uid), {
      uid: o.uid,
      weekId,
      matchUid: o.matchUid,
      profile: o.profile,
      compatibility: o.compatibility,
      breakdown: o.breakdown,
      reasons: o.reasons,
      status: o.status,
      threadId: o.threadId,
      stats: o.stats,
      revealedAt: Date.now()
    });
    if (o.threadId && o.matchUid) {
      batch.set(
        db.collection("threads").doc(o.threadId),
        { weekId, participants: [o.uid, o.matchUid].sort() },
        { merge: true }
      );
    }
  }
  await batch.commit();
}

export async function markWeekStatus(weekId: string, status: string): Promise<void> {
  await adminDb().collection("weeks").doc(weekId).set({ weekId, status, updatedAt: Date.now() }, { merge: true });
}
