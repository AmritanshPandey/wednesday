import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { IMBALANCE_ALERT_RATIO, MARKET_THRESHOLDS } from "@/lib/server/config";
import type { MetricsDoc, UserDoc } from "@/lib/app/types";

function ageBucket(age: number): string {
  if (age < 25) return "22-24";
  if (age < 28) return "25-27";
  if (age < 31) return "28-30";
  if (age < 34) return "31-33";
  return "34+";
}

/** Compute marketplace health for a week's active users. Pure — no I/O — so it
 *  is trivially testable and can be logged before anything is written. */
export function computeMetrics(weekId: string, users: UserDoc[], poolSizes: number[] = []): MetricsDoc {
  const byCity: Record<string, number> = {};
  const ageBuckets: Record<string, number> = {};
  let male = 0;
  let female = 0;
  let other = 0;

  for (const u of users) {
    const g = u.profile.gender;
    if (g === "Male") male += 1;
    else if (g === "Female") female += 1;
    else other += 1;
    byCity[u.profile.city] = (byCity[u.profile.city] ?? 0) + 1;
    const b = ageBucket(u.profile.age);
    ageBuckets[b] = (ageBuckets[b] ?? 0) + 1;
  }

  const smaller = Math.min(male, female);
  const larger = Math.max(male, female);
  const imbalanceRatio = smaller === 0 ? Infinity : larger / smaller;

  const sorted = [...poolSizes].sort((a, b) => a - b);
  const candidateDensity = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  const alerts: string[] = [];
  if (Number.isFinite(imbalanceRatio) && imbalanceRatio > IMBALANCE_ALERT_RATIO) {
    alerts.push(`Gender imbalance ${imbalanceRatio.toFixed(2)}:1 — the smaller side is structurally starved.`);
  } else if (!Number.isFinite(imbalanceRatio)) {
    alerts.push("One gender has zero active users — no cross-side matches are possible.");
  }
  if (other > 0) {
    alerts.push(`${other} active user(s) are outside the Male/Female split and cannot be matched under the MVP model.`);
  }

  return {
    weekId,
    activeUsers: users.length,
    maleCount: male,
    femaleCount: female,
    otherCount: other,
    byCity,
    ageBuckets,
    candidateDensity,
    imbalanceRatio: Number.isFinite(imbalanceRatio) ? Number(imbalanceRatio.toFixed(3)) : -1,
    alerts,
    computedAt: Date.now()
  };
}

export type MarketGate = { ok: true } | { ok: false; reason: string };

/** Whether a week is thick enough to run allocation. Below threshold we would
 *  only manufacture weak matches, so the pipeline rolls users forward instead. */
export function checkMarketGate(users: UserDoc[]): MarketGate {
  const male = users.filter((u) => u.profile.gender === "Male").length;
  const female = users.filter((u) => u.profile.gender === "Female").length;

  if (users.length < MARKET_THRESHOLDS.minActive) {
    return { ok: false, reason: `Only ${users.length} active members (need ${MARKET_THRESHOLDS.minActive}).` };
  }
  if (male < MARKET_THRESHOLDS.minPerGender || female < MARKET_THRESHOLDS.minPerGender) {
    return {
      ok: false,
      reason: `Need ${MARKET_THRESHOLDS.minPerGender} per side (have ${male} men, ${female} women).`
    };
  }
  return { ok: true };
}

export async function writeMetrics(metrics: MetricsDoc): Promise<void> {
  await adminDb().collection("weeks").doc(metrics.weekId).collection("system").doc("metrics").set(metrics);
}
