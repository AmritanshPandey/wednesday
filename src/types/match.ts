import type { CategoryScore } from "@/types/ranking";

export type MatchStatus =
  | "revealed"
  | "letter_sent"
  | "connected"
  | "expired"
  | "no_match";

export type MatchResult = {
  profileId: string | null;
  compatibility: number;
  breakdown: CategoryScore[];
  reasons: string[];
  status: MatchStatus;
  /** Day index (into WEEK_DAYS) when the user posted their letter. */
  letterSentOnDay?: number;
};

export type AllocationStats = {
  candidatesConsidered: number;
  passedDealBreakers: number;
  poolSize: number;
  marketSeekers: number;
  yourRankOfMatch: number | null;
  blockingPairs: number;
};
