import "server-only";

import { countBlockingPairs, galeShapley } from "@/lib/matching/gale-shapley";
import { MIN_COMPATIBILITY } from "@/lib/matching/market";
import { compatibilityBreakdown, compatibilityScore } from "@/lib/matching/compatibility";
import { computeNoMatchAdvice } from "@/lib/matching/no-match-advice";
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
 *  ranking first, then the rest of the shown pool by compatibility, then the
 *  allocator-only tail — reached only once everyone they saw is taken. */
function effectiveRanking(pool: PoolDoc | undefined, ranking: RankingDoc | undefined): string[] {
  const shown = (pool?.entries ?? []).map((e) => e.profileId); // already sorted desc
  const shownIds = new Set(shown);
  const ranked = ranking ? buildRankedIds(ranking.rounds) : [];

  const order: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    order.push(id);
  };

  // Their own ranking wins, but only over people they were actually shown.
  for (const id of ranked) if (shownIds.has(id)) push(id);
  for (const id of shown) push(id);
  for (const id of pool?.allocationTail ?? []) push(id);
  return order;
}

/**
 * Which side proposes this week. Deferred acceptance hands the proposing side
 * its best stable outcome and the receiving side its worst — measurably so —
 * which a fixed proposer would hand to the same gender every single week.
 * Alternating keeps the promise the deal-breaker copy makes.
 */
export function proposingGenderFor(weekId: string): "Male" | "Female" {
  const parsed = Date.parse(`${weekId}T00:00:00Z`);
  if (Number.isNaN(parsed)) return "Male";
  const weekIndex = Math.floor(parsed / 86_400_000 / 7);
  return weekIndex % 2 === 0 ? "Male" : "Female";
}

/**
 * Weekly pipeline steps 3–4 across the whole real market: build each side's
 * preference lists from their rankings, run deferred acceptance, and read out
 * a symmetric introduction for everyone. The proposing side alternates weekly
 * — see proposingGenderFor.
 */
export function allocateWeek(
  weekId: string,
  users: UserDoc[],
  pools: Map<string, PoolDoc>,
  rankings: Map<string, RankingDoc>
): MatchOutcome[] {
  const byUid = new Map(users.map((u) => [u.uid, u]));
  const proposing = proposingGenderFor(weekId);
  const receiving = proposing === "Male" ? "Female" : "Male";
  const seekers = users.filter((u) => u.profile.gender === proposing);
  const candidates = users.filter((u) => u.profile.gender === receiving);
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

    // Turn a no-match into actionable advice from the pool's own stats.
    const noMatchReasons = (): string[] => {
      const a = computeNoMatchAdvice(me.preferences, {
        candidatesConsidered: baseStats.candidatesConsidered,
        passedDealBreakers: baseStats.passedDealBreakers,
        poolSize: baseStats.poolSize
      });
      return [a.headline, a.suggestion];
    };

    const other = otherUid ? byUid.get(otherUid) : undefined;
    if (!other) {
      return {
        uid: me.uid,
        matchUid: null,
        profile: null,
        compatibility: 0,
        breakdown: [],
        reasons: noMatchReasons(),
        status: "no_match",
        threadId: null,
        stats: baseStats
      };
    }

    const breakdown = compatibilityBreakdown(me.profile, other.profile);
    const compatibility = compatibilityScore(breakdown);
    const effRank = effectiveRanking(poolDoc, rankings.get(me.uid));
    const rank = effRank.indexOf(other.uid);
    // effectiveRanking puts the shown pool first, so anything past it came from
    // the tail — a rank there would be about someone they never saw.
    const shownCount = poolDoc?.entries.length ?? 0;
    const yourRankOfMatch = rank >= 0 && rank < shownCount ? rank + 1 : null;
    const status: MatchStatus = compatibility >= MIN_COMPATIBILITY ? "revealed" : "no_match";

    return {
      uid: me.uid,
      matchUid: status === "revealed" ? other.uid : null,
      profile: status === "revealed" ? { ...toPublicProfile(other.profile), id: other.uid } : null,
      compatibility,
      breakdown,
      reasons: status === "revealed" ? reasonsFor(me, other) : noMatchReasons(),
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
