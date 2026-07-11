import "server-only";

import { countBlockingPairs, galeShapley } from "@/lib/matching/gale-shapley";
import { MIN_COMPATIBILITY } from "@/lib/matching/market";
import { compatibilityBreakdown, compatibilityScore } from "@/lib/matching/compatibility";
import { buildRankedIds } from "@/lib/app/ranking-logic";
import { reasonsFor } from "@/lib/server/pool";
import { threadIdFor, toPublicProfile, type PoolDoc, type RankingDoc, type UserDoc } from "@/lib/app/types";
import type { AllocationStats, MatchStatus } from "@/types/match";
import type { CategoryScore } from "@/types/ranking";
import type { Profile } from "@/types/profile";

export type MatchOutcome = {
  uid: string;
  matchUid: string | null;
  profile: Profile | null;
  compatibility: number;
  breakdown: CategoryScore[];
  reasons: string[];
  status: MatchStatus;
  threadId: string | null;
  stats: AllocationStats;
};

/** Effective preference order over the opposite side: the user's submitted
 *  ranking first, then any remaining pool members by compatibility. */
function effectiveRanking(pool: PoolDoc | undefined, ranking: RankingDoc | undefined): string[] {
  const compatOrder = (pool?.entries ?? []).map((e) => e.profileId); // already sorted desc
  const ranked = ranking ? buildRankedIds(ranking.rounds) : [];
  const seen = new Set(ranked);
  const order = [...ranked];
  for (const id of compatOrder) {
    if (!seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }
  // Keep only ids that are actually in this user's pool (valid, ≥50%, opposite side).
  const valid = new Set(compatOrder);
  return order.filter((id) => valid.has(id));
}

/**
 * Weekly pipeline steps 3–4 across the whole real market: build each side's
 * preference lists from their rankings, run deferred acceptance, and read out
 * a symmetric introduction for everyone. Male proposes to Female for MVP.
 */
export function allocateWeek(
  weekId: string,
  users: UserDoc[],
  pools: Map<string, PoolDoc>,
  rankings: Map<string, RankingDoc>
): MatchOutcome[] {
  const byUid = new Map(users.map((u) => [u.uid, u]));
  const seekers = users.filter((u) => u.profile.gender === "Male");
  const candidates = users.filter((u) => u.profile.gender === "Female");
  const seekerIndex = new Map(seekers.map((u, i) => [u.uid, i]));
  const candidateIndex = new Map(candidates.map((u, i) => [u.uid, i]));

  const seekerRank = seekers.map((u) => effectiveRanking(pools.get(u.uid), rankings.get(u.uid)));
  const candidateRank = candidates.map((u) => effectiveRanking(pools.get(u.uid), rankings.get(u.uid)));

  const seekerPrefs = seekerRank.map((order) =>
    order.map((id) => candidateIndex.get(id)).filter((i): i is number => i !== undefined)
  );
  const candidatePrefs = candidateRank.map((order) =>
    order.map((id) => seekerIndex.get(id)).filter((i): i is number => i !== undefined)
  );

  const matching = galeShapley(seekerPrefs, candidatePrefs);

  // Score matrices (rank-derived) so we can report a stable-ness figure.
  const scoreFromPrefs = (prefs: number[][], width: number) =>
    prefs.map((order) => {
      const row = new Array<number>(width).fill(0);
      order.forEach((idx, position) => {
        row[idx] = order.length - position;
      });
      return row;
    });
  const seekerScores = scoreFromPrefs(seekerPrefs, candidates.length);
  const candidateScores = scoreFromPrefs(candidatePrefs, seekers.length);
  const blockingPairs = countBlockingPairs(seekerScores, candidateScores, matching);

  const outcomes: MatchOutcome[] = [];

  const makeOutcome = (me: UserDoc, otherUid: string | null): MatchOutcome => {
    const poolDoc = pools.get(me.uid);
    const baseStats: AllocationStats = {
      candidatesConsidered: poolDoc?.candidatesConsidered ?? 0,
      passedDealBreakers: poolDoc?.passedDealBreakers ?? 0,
      poolSize: poolDoc?.entries.length ?? 0,
      marketSeekers: seekers.length + candidates.length,
      yourRankOfMatch: null,
      blockingPairs
    };

    const other = otherUid ? byUid.get(otherUid) : undefined;
    if (!other) {
      return {
        uid: me.uid,
        matchUid: null,
        profile: null,
        compatibility: 0,
        breakdown: [],
        reasons: [],
        status: "no_match",
        threadId: null,
        stats: baseStats
      };
    }

    const breakdown = compatibilityBreakdown(me.profile, other.profile);
    const compatibility = compatibilityScore(breakdown);
    const effRank = effectiveRanking(poolDoc, rankings.get(me.uid));
    const yourRankOfMatch = effRank.indexOf(other.uid) + 1 || null;
    const status: MatchStatus = compatibility >= MIN_COMPATIBILITY ? "revealed" : "no_match";

    return {
      uid: me.uid,
      matchUid: status === "revealed" ? other.uid : null,
      profile: status === "revealed" ? { ...toPublicProfile(other.profile), id: other.uid } : null,
      compatibility,
      breakdown,
      reasons: status === "revealed" ? reasonsFor(me, other) : [],
      status,
      threadId: status === "revealed" ? threadIdFor(weekId, me.uid, other.uid) : null,
      stats: { ...baseStats, yourRankOfMatch }
    };
  };

  seekers.forEach((seeker, i) => {
    const candIdx = matching.candidateOfSeeker[i];
    const otherUid = candIdx >= 0 ? candidates[candIdx].uid : null;
    outcomes.push(makeOutcome(seeker, otherUid));
  });
  candidates.forEach((candidate, j) => {
    const seekerIdx = matching.seekerOfCandidate[j];
    const otherUid = seekerIdx >= 0 ? seekers[seekerIdx].uid : null;
    outcomes.push(makeOutcome(candidate, otherUid));
  });
  // Anyone not on a side (blank/other gender) gets a quiet week.
  users
    .filter((u) => u.profile.gender !== "Male" && u.profile.gender !== "Female")
    .forEach((u) => outcomes.push(makeOutcome(u, null)));

  return outcomes;
}
