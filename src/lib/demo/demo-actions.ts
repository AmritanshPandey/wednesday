"use client";

import { DEADLINE_DAY, REVEAL_DAY, WEEK_DAYS } from "@/types/clock";
import type { Preferences, PreferenceSectionKey } from "@/types/preferences";
import type { Profile } from "@/types/profile";
import type { RankingRound } from "@/types/ranking";
import { buildPool, buildRounds, runAllocation } from "@/lib/matching/market";
import { getDemoState, resetDemoState, saveDemoState } from "@/lib/demo/demo-store";
import { CANDIDATES, type DemoState } from "@/lib/demo/seed-data";

const candidatesById = new Map(CANDIDATES.map((profile) => [profile.id, profile]));

export function getCandidate(profileId: string | null | undefined): Profile | undefined {
  return profileId ? candidatesById.get(profileId) : undefined;
}

function mutate(fn: (state: DemoState) => void) {
  const state = structuredClone(getDemoState());
  fn(state);
  saveDemoState(state);
}

// ---- Setup -----------------------------------------------------------------

export function updateProfile(patch: Partial<Profile>) {
  mutate((state) => {
    Object.assign(state.profile, patch);
  });
}

export function updatePreferences(patch: Partial<Preferences>) {
  mutate((state) => {
    Object.assign(state.preferences, patch);
  });
}

export function toggleDealBreaker(section: PreferenceSectionKey) {
  mutate((state) => {
    state.preferences.dealBreakers[section] = !state.preferences.dealBreakers[section];
  });
}

export function reachSetupStep(step: number) {
  mutate((state) => {
    state.setupStepReached = Math.max(state.setupStepReached, step);
  });
}

/** "Verify and join this week": lock the profile, run filter + score, deal the rounds. */
export function completeSetupAndJoin() {
  mutate((state) => {
    state.setupComplete = true;
    state.joinedWeek = true;
    const { pool, candidatesConsidered, passedDealBreakers } = buildPool(
      state.profile,
      state.preferences,
      CANDIDATES
    );
    state.pool = pool;
    state.candidatesConsidered = candidatesConsidered;
    state.passedDealBreakers = passedDealBreakers;
    state.rounds = buildRounds(pool);
    state.dayIndex = 0;
    state.match = null;
    state.stats = null;
    state.letters = [];
  });
}

// ---- Ranking ---------------------------------------------------------------

export function rankingComplete(state: DemoState): boolean {
  if (state.rounds.length === 0) return false;
  const poolRounds = state.rounds.filter((round) => !round.isFinal);
  const finalRound = state.rounds.find((round) => round.isFinal);
  if (!poolRounds.every((round) => round.submitted)) return false;
  // A single pool round needs no finals; otherwise the finals must be in.
  return poolRounds.length <= 1 ? true : Boolean(finalRound?.submitted);
}

export function currentRound(state: DemoState): RankingRound | undefined {
  return state.rounds.find((round) => !round.submitted);
}

export function setRoundOrder(roundNumber: number, order: string[]) {
  mutate((state) => {
    const round = state.rounds.find((item) => item.round === roundNumber);
    if (round && !round.submitted) round.rankedOrder = order;
  });
}

export function submitRound(roundNumber: number) {
  mutate((state) => {
    const round = state.rounds.find((item) => item.round === roundNumber);
    if (!round || round.submitted) return;
    round.submitted = true;

    const poolRounds = state.rounds.filter((item) => !item.isFinal);
    const hasFinal = state.rounds.some((item) => item.isFinal);
    if (!round.isFinal && poolRounds.every((item) => item.submitted) && poolRounds.length > 1 && !hasFinal) {
      const winners = poolRounds.map((item) => item.rankedOrder[0]);
      state.rounds.push({
        round: state.rounds.length + 1,
        isFinal: true,
        profileIds: [...winners],
        rankedOrder: [...winners],
        submitted: false
      });
    }

    // Ranking wrapped up on or after Wednesday → allocate immediately.
    if (rankingComplete(state) && state.dayIndex >= REVEAL_DAY && !state.match) {
      allocate(state);
    }
  });
}

/** Full preference order over the pool: finalists first, then the rest by in-round rank. */
export function buildUserRankedIds(state: DemoState): string[] {
  const finalRound = state.rounds.find((round) => round.isFinal);
  const poolRounds = state.rounds.filter((round) => !round.isFinal);
  const ranked: string[] = finalRound ? [...finalRound.rankedOrder] : [];
  const seen = new Set(ranked);
  const maxLength = Math.max(...poolRounds.map((round) => round.rankedOrder.length), 0);
  for (let position = 0; position < maxLength; position += 1) {
    for (const round of poolRounds) {
      const id = round.rankedOrder[position];
      if (id && !seen.has(id)) {
        ranked.push(id);
        seen.add(id);
      }
    }
  }
  return ranked;
}

// ---- Allocation & the simulated week ----------------------------------------

function allocate(state: DemoState) {
  const { match, stats } = runAllocation({
    user: state.profile,
    pool: state.pool,
    candidatesById,
    rankedIds: buildUserRankedIds(state),
    candidatesConsidered: state.candidatesConsidered,
    passedDealBreakers: state.passedDealBreakers
  });
  state.match = match;
  state.stats = stats;
}

function matchReply(state: DemoState): string {
  const match = getCandidate(state.match?.profileId);
  const user = state.profile;
  const shared = match ? user.interests.filter((interest) => match.interests.includes(interest)) : [];
  const sharedLine =
    shared.length > 0
      ? `You mentioned ${shared[0].toLowerCase()} — I had a feeling we would agree on that.`
      : "I had a feeling we would find plenty to talk about.";
  const closing = shared.includes("Coffee")
    ? "I'd love to continue this over coffee somewhere unhurried."
    : "I'd love to continue this on a slow walk somewhere green.";
  return [
    `Dear ${user.name},`,
    "",
    `Your letter made my Wednesday. I read it twice — once quickly, and once slowly, the way good letters deserve. ${sharedLine}`,
    "",
    `${closing} No rush, no scripts — just a real conversation.`,
    "",
    `Warmly,`,
    `${match?.name ?? "Your match"}`
  ].join("\n");
}

function applyDayEffects(state: DemoState) {
  // Wednesday: introductions are allocated once the ranking is sealed.
  if (state.dayIndex >= REVEAL_DAY && !state.match && rankingComplete(state)) {
    allocate(state);
  }
  const match = state.match;
  if (!match) return;

  // A posted letter is answered the next day.
  if (match.status === "letter_sent" && match.letterSentOnDay !== undefined && state.dayIndex > match.letterSentOnDay) {
    state.letters.push({
      id: `letter-match-${state.dayIndex}`,
      author: "match",
      body: matchReply(state),
      dayIndex: state.dayIndex
    });
    match.status = "connected";
    return;
  }

  // Thursday came and went without a move.
  if (match.status === "revealed" && state.dayIndex > DEADLINE_DAY) {
    match.status = "expired";
  }
}

export function advanceDay() {
  mutate((state) => {
    state.dayIndex = Math.min(state.dayIndex + 1, WEEK_DAYS.length - 1);
    applyDayEffects(state);
  });
}

export function jumpToWednesday() {
  mutate((state) => {
    while (state.dayIndex < REVEAL_DAY) {
      state.dayIndex += 1;
      applyDayEffects(state);
    }
  });
}

// ---- The one letter ----------------------------------------------------------

export function sendLetter(body: string) {
  mutate((state) => {
    const match = state.match;
    if (!match || match.status !== "revealed" || state.dayIndex > DEADLINE_DAY) return;
    state.letters.push({
      id: `letter-user-${state.dayIndex}`,
      author: "user",
      body,
      dayIndex: state.dayIndex
    });
    match.status = "letter_sent";
    match.letterSentOnDay = state.dayIndex;
  });
}

export function resetDemo() {
  resetDemoState();
}
