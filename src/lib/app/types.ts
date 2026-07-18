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
  /** Marketplace membership. Joining flips this to "active" in O(1) — the
   *  weekly batch reads it instead of rebuilding pools on every join. */
  status?: "active" | "inactive";
  /** The week this active user is entered for (mirrors joinedWeekId; the batch
   *  pipeline queries on this pair). */
  activeWeekId?: string | null;
  /** Consecutive weeks ending in no match — drives the humane relaxation of
   *  soft preferences and the "why unmatched" advice. Never touches hard
   *  deal-breakers. */
  consecutiveNoMatchWeeks?: number;
  /** Stable pointer to the user's live chat, set when a match becomes mutual.
   *  Lives on the user (not the weekly match) so the 7-day window stays
   *  reachable after the next Wednesday's match arrives. */
  activeChat?: ActiveChat | null;
  createdAt: number;
  updatedAt: number;
};

export type ActiveChat = {
  threadId: string;
  weekId: string;
  matchUid: string;
  connectedAt: number;
  /** Denormalized so the chat header works even after the weekly match view
   *  has rolled over to a new week. */
  matchName: string;
  matchPhotoUrl: string | null;
};

/** weeks/{weekId}/snapshots/{uid} — an immutable freeze of a user's profile +
 *  preferences taken at the Tuesday deadline. Matching reads ONLY this, never
 *  the live user doc, so a mid-week edit can't shift an allocation. */
export type SnapshotDoc = {
  uid: string;
  weekId: string;
  profile: Profile;
  preferences: Preferences;
  /** Content hash — lets the freeze stage skip rewriting an unchanged snapshot. */
  hash: string;
  frozenAt: number;
};

/** The stages of the weekly batch pipeline, in run order. `pools` and `freeze`
 *  are chunked + resumable over users; `allocate` computes the matching,
 *  validates it, and only then publishes — nothing is written if validation
 *  fails, so publication can never be partial or corrupt. */
export type PipelineStage = "pools" | "freeze" | "allocate";
export const PIPELINE_STAGES: PipelineStage[] = ["pools", "freeze", "allocate"];

export type StageStatus = "pending" | "running" | "done" | "failed";

export type StageState = {
  status: StageStatus;
  /** Resumable checkpoint — e.g. the index of the next user slice to process.
   *  A re-invocation continues from here instead of starting over. */
  cursor: number;
  startedAt: number | null;
  finishedAt: number | null;
  error: string | null;
};

/** weeks/{weekId}/system/job — orchestration state. Every stage reads and
 *  checkpoints here, so a crash mid-run resumes rather than restarts. */
export type JobDoc = {
  weekId: string;
  status: "collecting" | "running" | "rolled_forward" | "revealed" | "failed";
  stages: Record<PipelineStage, StageState>;
  updatedAt: number;
};

/** weeks/{weekId}/system/metrics — marketplace health for monitoring + alerts. */
export type MetricsDoc = {
  weekId: string;
  activeUsers: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  byCity: Record<string, number>;
  ageBuckets: Record<string, number>;
  /** Median pool size — a proxy for how thick the market is. */
  candidateDensity: number;
  /** max(m,f)/min(m,f); >1 means one side is structurally starved. */
  imbalanceRatio: number;
  alerts: string[];
  computedAt: number;
};

/** weeks/{weekId}/system/validation — the pre-publish safety report. */
export type ValidationDoc = {
  weekId: string;
  passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
  checkedAt: number;
};

export type OutcomeEventType =
  | "accepted"
  | "chat_started"
  | "first_reply"
  | "photo_exchanged"
  | "number_exchanged"
  | "met"
  | "still_chatting_30d";

/** outcomes/{weekId}/uid/{uid} — append-only feedback log. The eventual
 *  training signal for a learned compatibility model; nothing consumes it yet. */
export type OutcomeDoc = {
  uid: string;
  weekId: string;
  matchUid: string | null;
  events: { type: OutcomeEventType; ts: number }[];
  updatedAt: number;
};

/** weeks/{weekId}/pools/{uid} — the 25-person shortlist for this user. */
export type PoolDoc = {
  uid: string;
  weekId: string;
  entries: PoolEntry[];
  /** Ids ranked below the shown pool, for the allocator to fall back on when
   *  all 25 are introduced elsewhere. Never shown or ranked. Optional: pools
   *  built before this existed simply have no fallback. */
  allocationTail?: string[];
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
  /** Set when both letters land → the start of the 7-day chat window. */
  connectedAt?: number | null;
  revealedAt: number;
};

export type LetterDoc = {
  id: string;
  authorUid: string;
  body: string;
  createdAt: number;
};

/** threads/{threadId}/messages/{messageId} — chat messages within the 7-day
 *  window. Same shape as a letter, but with no per-person limit. */
export type MessageDoc = {
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
