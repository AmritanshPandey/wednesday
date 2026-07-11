import { NextResponse } from "next/server";
import { computeWeekClock } from "@/lib/week";
import { allocateWeek } from "@/lib/server/allocate";
import {
  getJoinedUsers,
  getPools,
  getRankings,
  isCronAuthorized,
  markWeekStatus,
  writeOutcomes
} from "@/lib/server/data";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Wednesday cron: run the allocation and reveal introductions for the week. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return runAllocation();
}

export async function runAllocation() {
  const { weekId } = computeWeekClock();
  const [users, pools, rankings] = await Promise.all([getJoinedUsers(weekId), getPools(weekId), getRankings(weekId)]);
  const outcomes = allocateWeek(weekId, users, pools, rankings);
  await writeOutcomes(weekId, outcomes);
  await markWeekStatus(weekId, "revealed");
  return NextResponse.json({ ok: true, weekId, matched: outcomes.filter((o) => o.status === "revealed").length });
}
