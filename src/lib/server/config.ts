import "server-only";

/**
 * When true, joining is O(1) (just marks the user active) and all matching
 * work runs in the weekly batch pipeline. When false, the legacy rebuild-on-
 * join path is used. Default OFF so the refactor can ship dark and be cut over
 * deliberately — see the migration plan. Set USE_BATCH_PIPELINE=true to enable.
 */
export const USE_BATCH_PIPELINE = process.env.USE_BATCH_PIPELINE === "true";

/**
 * Thin-market thresholds. Below these a week produces no allocation — users
 * roll forward with an honest "waiting for more members" message rather than
 * a hollow match. Deliberately conservative; tune from real `metrics` docs.
 */
export const MARKET_THRESHOLDS = {
  minActive: 40,
  minPerGender: 15
} as const;

/** Imbalance ratio above this raises an alert on the metrics doc. */
export const IMBALANCE_ALERT_RATIO = 1.6;

/**
 * How many users a single pipeline invocation processes before checkpointing
 * and yielding. Keeps each run inside the serverless time budget; the next
 * invocation resumes from the cursor. Firestore batches cap at 500 ops, and a
 * pool write touches 2 docs (pool + ranking), so keep this ≤ 200.
 */
export const PIPELINE_CHUNK = 150;

/** Firestore hard limit on writes per batched commit. */
export const FIRESTORE_BATCH_LIMIT = 500;

/** After this many consecutive no-match weeks, soft (never hard) preferences
 *  are relaxed for the next build and the user is shown targeted advice. */
export const NO_MATCH_RELAX_AFTER = 2;
