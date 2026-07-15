import type { CategoryScore, PoolEntry, RankingRound } from "@/types/ranking";
import type { MatchStatus } from "@/types/match";
import type { Preferences } from "@/types/preferences";
import type { Profile } from "@/types/profile";

/** users/{uid} */
export type UserDoc = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profile: Profile;
  preferences: Preferences;
  setupComplete: boolean;
  setupStepReached: number;
  /** The weekId this user is entered into (set when they join). */
  joinedWeekId: string | null;
  createdAt: number;
  updatedAt: number;
};

/** weeks/{weekId}/pools/{uid} — the 25-person shortlist for this user. */
export type PoolDoc = {
  uid: string;
  weekId: string;
  entries: PoolEntry[];
  candidatesConsidered: number;
  passedDealBreakers: number;
  builtAt: number;
};

/** weeks/{weekId}/rankings/{uid} */
export type RankingDoc = {
  uid: string;
  weekId: string;
  rounds: RankingRound[];
  submitted: boolean;
  updatedAt: number;
};

/** weeks/{weekId}/matches/{uid} — symmetric: each side gets one. */
export type MatchDoc = {
  uid: string;
  weekId: string;
  matchUid: string | null;
  profile: Profile | null;
  compatibility: number;
  breakdown: CategoryScore[];
  reasons: string[];
  status: MatchStatus;
  threadId: string | null;
  revealedAt: number;
};

export type LetterDoc = {
  id: string;
  authorUid: string;
  body: string;
  createdAt: number;
};

/** Deterministic thread id for a pair within a week. */
export function threadIdFor(weekId: string, a: string, b: string): string {
  return `${weekId}__${[a, b].sort().join("__")}`;
}

/** Strip fields that should never leave the server / reach other users. */
export function toPublicProfile(profile: Profile): Profile {
  return { ...profile, taxBracket: "", linkedinHandle: "", instagramHandle: "" };
}

export type PoolEntryLive = PoolEntry & { profile: Profile };
