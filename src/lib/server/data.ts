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

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
}

/** Build (or rebuild) one user's pool from the week's other joined users, and
 *  seed an empty ranking with the pool dealt into rounds of five. */
export async function buildAndWritePool(weekId: string, me: UserDoc, others: UserDoc[]): Promise<void> {
  const { entries, candidatesConsidered, passedDealBreakers } = buildPoolFor(me, others);
  const db = adminDb();

  const poolDoc: PoolDoc = {
    uid: me.uid,
    weekId,
    entries,
    candidatesConsidered,
    passedDealBreakers,
    builtAt: Date.now()
  };
  await db.collection("weeks").doc(weekId).collection("pools").doc(me.uid).set(poolDoc);

  // Deal into rounds of five (round-robin, mirroring the client buildRounds).
  const ids = entries.map((e) => e.profileId);
  const roundCount = Math.max(1, Math.ceil(ids.length / 5));
  const buckets: string[][] = Array.from({ length: roundCount }, () => []);
  ids.forEach((id, i) => buckets[i % roundCount].push(id));
  const rounds = buckets.map((bucket, i) => ({
    round: i + 1,
    isFinal: false,
    profileIds: bucket,
    rankedOrder: [...bucket],
    submitted: false
  }));

  const rankingRef = db.collection("weeks").doc(weekId).collection("rankings").doc(me.uid);
  const existing = await rankingRef.get();
  if (!existing.exists) {
    const rankingDoc: RankingDoc = { uid: me.uid, weekId, rounds, submitted: false, updatedAt: Date.now() };
    await rankingRef.set(rankingDoc);
  }
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
