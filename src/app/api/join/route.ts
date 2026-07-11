import { NextResponse } from "next/server";
import { buildAndWritePool, getJoinedUsers, getUser, uidFromRequest } from "@/lib/server/data";

export const runtime = "nodejs";

/** Called when a user verifies + joins the week. Builds their pool from the
 *  other joined users right away, and refreshes those users' pools so the new
 *  arrival can appear for them too. */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId } = (await req.json()) as { weekId: string };
  if (!weekId) return NextResponse.json({ error: "weekId required" }, { status: 400 });

  const me = await getUser(uid);
  if (!me || me.joinedWeekId !== weekId) {
    return NextResponse.json({ error: "not joined" }, { status: 400 });
  }

  const everyone = await getJoinedUsers(weekId);
  const others = everyone.filter((u) => u.uid !== uid);

  await buildAndWritePool(weekId, me, others);
  // Refresh the others so this new person can surface in their pools too.
  await Promise.all(others.map((other) => buildAndWritePool(weekId, other, everyone.filter((u) => u.uid !== other.uid))));

  return NextResponse.json({ ok: true, poolPeers: others.length });
}
