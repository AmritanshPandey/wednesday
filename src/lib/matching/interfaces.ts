import type { Preferences } from "@/types/preferences";
import type { Profile } from "@/types/profile";
import type { CategoryScore, PoolEntry } from "@/types/ranking";

/**
 * Replaceable seams for the matching stack. Today every one of these is
 * implemented by hand-tuned rules (see compatibility.ts, pool.ts). They exist
 * so a learned model can be dropped in later WITHOUT touching allocation:
 * Gale-Shapley only ever sees preference orders, so anything that produces a
 * better order or score plugs in here. No ML implementations exist yet.
 */

/** Numeric per-category features extracted from a pair, before scoring. */
export type CompatibilityFeatures = {
  categories: CategoryScore[];
};

/** Turn a pair into a single 0–100 compatibility number. The layered rule
 *  implementation is `RuleCompatibilityModel`; a trained model (XGBoost,
 *  learning-to-rank, embeddings) would implement the same interface. */
export interface CompatibilityModel {
  extractFeatures(a: Profile, b: Profile): CompatibilityFeatures;
  scoreFeatures(features: CompatibilityFeatures): number;
  /** Convenience: extract → score → clamp. */
  score(a: Profile, b: Profile): { compatibility: number; breakdown: CategoryScore[] };
}

/** Produces one user's ranked candidate set. Today: hard filter + top-K by
 *  compatibility (buildPoolFor). Future: an ANN/embedding retriever. */
export interface CandidateGenerator {
  generate(me: { profile: Profile; preferences: Preferences }, others: { uid: string; profile: Profile; preferences: Preferences }[]): {
    entries: PoolEntry[];
    allocationTail: string[];
    candidatesConsidered: number;
    passedDealBreakers: number;
  };
}

/** Re-orders a user's shown pool. Today: the user's own drag-ranking, else
 *  compatibility order. Future: a personalized ranking model. */
export interface RankingModel {
  rank(candidateIds: string[], context: { uid: string }): string[];
}

/** Where post-introduction outcome events are recorded (the training signal). */
export interface FeedbackSink {
  record(weekId: string, uid: string, event: { type: string; ts: number }): Promise<void>;
}

/** Turns a match into human-readable reasons. Today: buildReasons. Never
 *  exposes raw weights. */
export interface ExplainabilityModule {
  explain(a: Profile, b: Profile): string[];
}
