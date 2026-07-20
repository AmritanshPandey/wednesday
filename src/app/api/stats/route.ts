import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { computeWeekClock } from "@/lib/week";
import { getActiveUsers } from "@/lib/server/data";
import { checkMarketGate } from "@/lib/server/market";
import { FOUNDING_CAP_PER_SIDE, MARKET_THRESHOLDS } from "@/lib/server/config";
import type { FoundingDoc } from "@/lib/app/types";

export const runtime = "nodejs";
// Public numbers only, cached at the edge for 30s — the landing and waiting
// room poll this. No per-user data ever leaves here.
export const revalidate = 30;

export async function GET() {
  const db = adminDb();
  const { weekId } = computeWeekClock();

  const [ledgerSnap, active] = await Promise.all([
    db.collection("system").doc("founding").get(),
    getActiveUsers(weekId)
  ]);

  const ledger = (ledgerSnap.data() as FoundingDoc | undefined) ?? {
    male: 0,
    female: 0,
    maleCap: FOUNDING_CAP_PER_SIDE,
    femaleCap: FOUNDING_CAP_PER_SIDE,
    updatedAt: 0
  };

  const gate = checkMarketGate(active);
  // "Launched" once the market can sustain a weekly cycle: the same predicate
  // the Thursday pool build uses, so the waiting room and the pipeline agree.
  const launched = gate.ok;

  return NextResponse.json({
    male: ledger.male,
    female: ledger.female,
    maleCap: ledger.maleCap,
    femaleCap: ledger.femaleCap,
    total: ledger.male + ledger.female,
    totalCap: ledger.maleCap + ledger.femaleCap,
    activeUsers: active.length,
    launched,
    thresholds: MARKET_THRESHOLDS,
    weekId
  });
}
