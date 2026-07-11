import { NextResponse } from "next/server";
import { computeWeekClock } from "@/lib/week";
import { buildAndWritePool, getJoinedUsers, isCronAuthorized, markWeekStatus } from "@/lib/server/data";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Thursday cron: (re)build every joined user's pool for the current week. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId } = computeWeekClock();
  const users = await getJoinedUsers(weekId);
  await Promise.all(users.map((me) => buildAndWritePool(weekId, me, users.filter((u) => u.uid !== me.uid))));
  await markWeekStatus(weekId, "ranking");

  return NextResponse.json({ ok: true, weekId, users: users.length });
}
