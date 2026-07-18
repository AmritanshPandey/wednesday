import type { CategoryScore } from "@/types/ranking";

export type MatchStatus =
  | "revealed"
  | "letter_sent"
  | "connected"
  | "closed" // the 7-day chat window ended — read-only archive
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
  /** When both letters landed — the start of the 7-day chat window. */
  connectedAt?: number | null;
};

export type AllocationStats = {
  candidatesConsidered: number;
  passedDealBreakers: number;
  poolSize: number;
  marketSeekers: number;
  yourRankOfMatch: number | null;
  blockingPairs: number;
};
