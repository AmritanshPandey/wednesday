import { NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/server/data";
import { runAllocation } from "@/app/api/cron/allocate/route";

export const runtime = "nodejs";

/** Dev-only: let a signed-in user trigger the allocation without waiting for
 *  the Wednesday cron. Guarded by the dev-tools flag. */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS !== "true") {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return runAllocation();
}
