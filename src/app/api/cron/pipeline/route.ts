import { NextResponse } from "next/server";
import { computeWeekClock, type CyclePhase } from "@/lib/week";
import { USE_BATCH_PIPELINE } from "@/lib/server/config";
import { buildAndWritePool, getActiveUsers, isCronAuthorized, markWeekStatus } from "@/lib/server/data";
import { runStage } from "@/lib/server/pipeline";
import { runAllocation } from "@/app/api/cron/allocate/route";
import type { PipelineStage } from "@/lib/app/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Which pipeline stage is due, from the cycle phase. Fired at each stage's
 *  scheduled time (see vercel.json); the phase mapping makes the single route
 *  self-selecting and idempotent — a duplicate fire is a no-op once the job
 *  stage is marked done. */
function stageForPhase(phase: CyclePhase): PipelineStage | null {
  if (phase === "ranking") return "pools"; // Thursday: build pools for the ranking window
  if (phase === "sealed") return "freeze"; // Tuesday: freeze the immutable snapshot
  if (phase === "reveal") return "allocate"; // Wednesday: allocate + validate + publish
  return null;
}

/** The unified weekly cron. Runs the due stage for the current cycle. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId, phase } = computeWeekClock();
  const stage = stageForPhase(phase);
  if (!stage) return NextResponse.json({ ok: true, weekId, phase, note: "no stage due" });

  if (USE_BATCH_PIPELINE) {
    const result = await runStage(weekId, stage);
    return NextResponse.json({ ok: true, mode: "batch", weekId, phase, ...result });
  }

  // Legacy behaviour, phase-mapped so the same cron entry works pre-cutover.
  if (stage === "pools") {
    const users = await getActiveUsers(weekId);
    await Promise.all(users.map((me) => buildAndWritePool(weekId, me, users.filter((u) => u.uid !== me.uid))));
    await markWeekStatus(weekId, "ranking");
    return NextResponse.json({ ok: true, mode: "legacy", weekId, stage, users: users.length });
  }
  if (stage === "allocate") return runAllocation();
  return NextResponse.json({ ok: true, mode: "legacy", weekId, stage: "freeze", note: "no-op in legacy mode" });
}
