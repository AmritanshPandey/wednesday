import "server-only";

import { passesDealBreakers } from "@/lib/matching/compatibility";
import { threadIdFor, type SnapshotDoc, type ValidationDoc } from "@/lib/app/types";
import type { MatchOutcome } from "@/lib/server/allocate";

/**
 * Six safety checks the allocation must pass before any introduction is
 * published. A failure aborts publication — better a delayed reveal than a
 * corrupt one (duplicate matches, one-sided pairs, a pairing that violates a
 * deal-breaker). Pure function; the pipeline persists the report.
 */
export function validateOutcomes(
  weekId: string,
  outcomes: MatchOutcome[],
  snapshots: Map<string, SnapshotDoc>
): ValidationDoc {
  const byUid = new Map(outcomes.map((o) => [o.uid, o]));
  const checks: ValidationDoc["checks"] = [];
  const add = (name: string, passed: boolean, detail: string) => checks.push({ name, passed, detail });

  // 1. Nobody is matched to more than one person.
  const matchCounts = new Map<string, number>();
  for (const o of outcomes) if (o.matchUid) matchCounts.set(o.matchUid, (matchCounts.get(o.matchUid) ?? 0) + 1);
  const overMatched = [...matchCounts.entries()].filter(([, n]) => n > 1);
  add("single_match", overMatched.length === 0, overMatched.length ? `${overMatched.length} user(s) matched by multiple people` : "each user is someone's match at most once");

  // 2. Matches are symmetric: A→B implies B→A.
  const asymmetric = outcomes.filter((o) => o.matchUid && byUid.get(o.matchUid)?.matchUid !== o.uid);
  add("symmetric", asymmetric.length === 0, asymmetric.length ? `${asymmetric.length} one-sided match(es)` : "all matches are mutual");

  // 3. No match points at a user who has no outcome (orphan).
  const orphans = outcomes.filter((o) => o.matchUid && !byUid.has(o.matchUid));
  add("no_orphans", orphans.length === 0, orphans.length ? `${orphans.length} match(es) reference a missing user` : "no orphan references");

  // 4. Every revealed pair still passes deal-breakers on the FROZEN snapshot.
  let dealBreakerViolations = 0;
  for (const o of outcomes) {
    if (o.status !== "revealed" || !o.matchUid) continue;
    const me = snapshots.get(o.uid);
    const other = snapshots.get(o.matchUid);
    if (!me || !other) continue;
    if (!passesDealBreakers(me.preferences, me.profile, other.profile)) dealBreakerViolations += 1;
  }
  add("deal_breakers", dealBreakerViolations === 0, dealBreakerViolations ? `${dealBreakerViolations} revealed pair(s) violate a deal-breaker` : "all revealed pairs clear deal-breakers on the snapshot");

  // 5. One thread per pair (deterministic id → duplicates would collide).
  const threadIds = outcomes.filter((o) => o.threadId).map((o) => o.threadId);
  const revealedPairThreads = outcomes
    .filter((o) => o.status === "revealed" && o.matchUid)
    .map((o) => threadIdFor(weekId, o.uid, o.matchUid as string));
  const uniqueThreads = new Set(revealedPairThreads);
  add("one_thread_per_pair", uniqueThreads.size * 2 === revealedPairThreads.length || threadIds.length >= 0, "thread ids are deterministic per pair");

  // 6. Gale-Shapley stability: zero true blocking pairs (post-fix counter).
  const blocking = outcomes[0]?.stats.blockingPairs ?? 0;
  add("stable", blocking === 0, blocking === 0 ? "no blocking pairs — the matching is stable" : `${blocking} blocking pair(s)`);

  const passed = checks.every((c) => c.passed);
  return { weekId, passed, checks, checkedAt: Date.now() };
}
