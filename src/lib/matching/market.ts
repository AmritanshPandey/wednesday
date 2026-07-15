import type { AllocationStats, MatchResult } from "@/types/match";
import type { Preferences, PreferenceSectionKey } from "@/types/preferences";
import { PREFERENCE_SECTIONS } from "@/types/preferences";
import type { PoolEntry, RankingRound } from "@/types/ranking";
import type { Profile } from "@/types/profile";
import {
  buildReasons,
  compatibilityBreakdown,
  compatibilityScore,
  passesDealBreakers,
  softPreferenceAdjustment
} from "@/lib/matching/compatibility";
import { galeShapley, countBlockingPairs } from "@/lib/matching/gale-shapley";
import { hashString, noise } from "@/lib/matching/random";

export const MIN_COMPATIBILITY = 50;
export const POOL_TARGET = 25;
export const ROUND_SIZE = 5;

export function emptyDealBreakers(): Record<PreferenceSectionKey, boolean> {
  return Object.fromEntries(PREFERENCE_SECTIONS.map((section) => [section, false])) as Record<
    PreferenceSectionKey,
    boolean
  >;
}

/**
 * Candidates get simple, deterministic preferences of their own so the
 * deal-breaker filter runs in both directions — an introduction only
 * exists when it works for both sides.
 */
export function deriveCandidatePreferences(candidate: Profile): Preferences {
  const h = hashString(candidate.id);
  const dealBreakers = emptyDealBreakers();
  let smokingPref = "Fine either way";
  let foodPref = "No preference";
  let cityPref = "Anywhere in India";

  if (candidate.smoking === "No" && h % 3 === 0) {
    smokingPref = "Non-smoker only";
    dealBreakers.smoking = true;
  }
  if (candidate.food === "Vegetarian" && h % 6 === 0) {
    foodPref = "Vegetarian only";
    dealBreakers.food = true;
  }
  if (candidate.relocation === "My city only" && h % 6 === 1) {
    cityPref = "My city only";
    dealBreakers.city = true;
  }

  return {
    ageMin: candidate.age - 3,
    ageMax: candidate.age + 7,
    cityPref,
    religionPref: "No preference",
    timelinePref: "No preference",
    childrenPref: "No preference",
    relocationPref: "No preference",
    financePref: "No preference",
    smokingPref,
    drinkingPref: "Fine either way",
    cannabisPref: "Fine either way",
    foodPref,
    dealBreakers: { ...dealBreakers, age: true }
  };
}

export type PoolBuildResult = {
  pool: PoolEntry[];
  candidatesConsidered: number;
  passedDealBreakers: number;
};

/**
 * Weekly pipeline steps 1–2: filter on hard rules (both directions), score
 * the survivors, drop anyone below the 50% floor, keep the top 25.
 */
export function buildPool(user: Profile, prefs: Preferences, candidates: Profile[]): PoolBuildResult {
  const mutual = candidates.filter(
    (candidate) =>
      passesDealBreakers(prefs, user, candidate) &&
      passesDealBreakers(deriveCandidatePreferences(candidate), candidate, user)
  );

  const scored = mutual
    .map((candidate) => {
      const breakdown = compatibilityBreakdown(user, candidate);
      // Cap at 97 — a perfect score reads as fake, and honesty is the brand.
      const compatibility = Math.max(
        0,
        Math.min(97, compatibilityScore(breakdown) + softPreferenceAdjustment(prefs, user, candidate))
      );
      return { profileId: candidate.id, compatibility, breakdown } satisfies PoolEntry;
    })
    .filter((entry) => entry.compatibility >= MIN_COMPATIBILITY)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, POOL_TARGET);

  return { pool: scored, candidatesConsidered: candidates.length, passedDealBreakers: mutual.length };
}

/**
 * Deal the pool into rounds of five, round-robin from the top of the
 * compatibility order so every round holds a spread of strong profiles.
 */
export function buildRounds(pool: PoolEntry[]): RankingRound[] {
  const roundCount = Math.max(1, Math.ceil(pool.length / ROUND_SIZE));
  const rounds: PoolEntry[][] = Array.from({ length: roundCount }, () => []);
  pool.forEach((entry, index) => {
    rounds[index % roundCount].push(entry);
  });
  return rounds.map((entries, index) => {
    const ids = entries.map((entry) => entry.profileId);
    return { round: index + 1, isFinal: false, profileIds: ids, rankedOrder: [...ids], submitted: false };
  });
}

export type AllocationInput = {
  user: Profile;
  pool: PoolEntry[];
  candidatesById: Map<string, Profile>;
  /** The user's full preference order over the pool, best first. */
  rankedIds: string[];
  candidatesConsidered: number;
  passedDealBreakers: number;
};

/**
 * Weekly pipeline steps 3–4: run deferred acceptance over the whole
 * simulated market and read out the user's allocation.
 */
export function runAllocation(input: AllocationInput): { match: MatchResult; stats: AllocationStats } {
  const { pool, candidatesById, rankedIds } = input;
  const n = pool.length;
  const poolIds = pool.map((entry) => entry.profileId);
  const compatById = new Map(pool.map((entry) => [entry.profileId, entry.compatibility]));

  const noMatch = (): { match: MatchResult; stats: AllocationStats } => ({
    match: { profileId: null, compatibility: 0, breakdown: [], reasons: [], status: "no_match" },
    stats: {
      candidatesConsidered: input.candidatesConsidered,
      passedDealBreakers: input.passedDealBreakers,
      poolSize: n,
      marketSeekers: n,
      yourRankOfMatch: null,
      blockingPairs: 0
    }
  });

  if (n === 0) return noMatch();

  // --- Base scores ------------------------------------------------------
  // Seeker 0 is the user; their scores encode the ranking they submitted.
  // Rivals are simulated seekers whose taste blends shared "popularity"
  // with personal noise, so the market has realistic overlap without
  // changing the user's submitted order.
  const popularity = poolIds.map(
    (id) => 0.3 + 0.55 * noise(`pop:${id}`) + 0.15 * ((compatById.get(id) ?? 50) / 100)
  );
  const seekerScores: number[][] = [];
  seekerScores.push(poolIds.map((id) => 1 - rankedIds.indexOf(id) / n));
  for (let rival = 1; rival < n; rival += 1) {
    seekerScores.push(
      poolIds.map((id, c) => 0.55 * popularity[c] + 0.45 * noise(`rival${rival}:${id}`))
    );
  }

  const byScoreDesc = (scores: number[]) =>
    Array.from({ length: scores.length }, (_, index) => index).sort((a, b) => scores[b] - scores[a]);

  const seekerPrefs = seekerScores.map(byScoreDesc);

  // Candidates rank seekers: the user's appeal tracks mutual compatibility,
  // rivals draw from a fixed attractiveness plus per-pair noise.
  const candidateScores: number[][] = poolIds.map((id) => {
    const scores = new Array<number>(n).fill(0);
    scores[0] = 0.65 * ((compatById.get(id) ?? 50) / 100) + 0.35 * noise(`cand:${id}:user`);
    for (let rival = 1; rival < n; rival += 1) {
      scores[rival] = 0.5 * (0.35 + 0.65 * noise(`attr:${rival}`)) + 0.5 * noise(`cand:${id}:rival${rival}`);
    }
    return scores;
  });
  const candidatePrefs = candidateScores.map(byScoreDesc);

  // --- Deferred acceptance ------------------------------------------------
  const matching = galeShapley(seekerPrefs, candidatePrefs);
  const matchedIndex = matching.candidateOfSeeker[0];
  if (matchedIndex === -1) return noMatch();

  const matchedId = poolIds[matchedIndex];
  const compatibility = compatById.get(matchedId) ?? 0;
  if (compatibility < MIN_COMPATIBILITY) return noMatch();

  const matchedProfile = candidatesById.get(matchedId);
  const poolEntry = pool.find((entry) => entry.profileId === matchedId);
  const blockingPairs = countBlockingPairs(seekerScores, candidateScores, matching);

  return {
    match: {
      profileId: matchedId,
      compatibility,
      breakdown: poolEntry?.breakdown ?? [],
      reasons: matchedProfile ? buildReasons(input.user, matchedProfile) : [],
      status: "revealed"
    },
    stats: {
      candidatesConsidered: input.candidatesConsidered,
      passedDealBreakers: input.passedDealBreakers,
      poolSize: n,
      marketSeekers: n,
      yourRankOfMatch: rankedIds.indexOf(matchedId) + 1,
      blockingPairs
    }
  };
}
