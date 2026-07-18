import { NextResponse } from "next/server";
import { computeWeekClock } from "@/lib/week";
import { isCronAuthorized } from "@/lib/server/data";
import { getJob, runStageToCompletion } from "@/lib/server/pipeline";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/app/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Manual pipeline control for recovery and large-market completion. Drives a
 * stage to completion across resumable passes (a single scheduled cron does one
 * pass; a huge market or a mid-run crash may need more). Cron-secret gated.
 *
 *   POST /api/admin/run-stage { "stage": "pools" | "freeze" | "allocate", "weekId"?: "..." }
 *   GET  /api/admin/run-stage?stage=allocate           → run a stage
 *   GET  /api/admin/run-stage                          → inspect job state
 */
async function handle(stage: PipelineStage | null, weekId: string) {
  if (!stage) {
    const job = await getJob(weekId);
    return NextResponse.json({ weekId, job });
  }
  if (!PIPELINE_STAGES.includes(stage)) {
    return NextResponse.json({ error: `unknown stage "${stage}"` }, { status: 400 });
  }
  const result = await runStageToCompletion(weekId, stage);
  return NextResponse.json({ ok: true, weekId, ...result });
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") as PipelineStage | null;
  const weekId = url.searchParams.get("weekId") ?? computeWeekClock().weekId;
  return handle(stage, weekId);
}

export async function POST(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { stage?: PipelineStage; weekId?: string };
  const weekId = body.weekId ?? computeWeekClock().weekId;
  return handle(body.stage ?? null, weekId);
}
