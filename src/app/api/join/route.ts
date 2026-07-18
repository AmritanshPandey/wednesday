import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { USE_BATCH_PIPELINE } from "@/lib/server/config";
import { buildAndWritePool, getJoinedUsers, getUser, uidFromRequest } from "@/lib/server/data";

export const runtime = "nodejs";

/**
 * Called when a user verifies + joins the week.
 *
 * Batch mode (USE_BATCH_PIPELINE): O(1). Just marks the user active for the
 * week; all pool/score/allocate work happens once in the weekly pipeline. This
 * removes the O(n²) write storm the legacy path caused (~100M writes/season at
 * 10k users — see scratch-benchmark.mjs).
 *
 * Legacy mode: rebuilds the joiner's pool and every other joined user's pool so
 * the newcomer can appear. Retained behind the flag for a safe cutover.
 */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId } = (await req.json()) as { weekId: string };
  if (!weekId) return NextResponse.json({ error: "weekId required" }, { status: 400 });

  const me = await getUser(uid);
  if (!me || me.joinedWeekId !== weekId) {
    return NextResponse.json({ error: "not joined" }, { status: 400 });
  }

  if (USE_BATCH_PIPELINE) {
    // O(1): a single doc update. The weekly pipeline does the rest.
    await adminDb()
      .collection("users")
      .doc(uid)
      .set({ status: "active", activeWeekId: weekId, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ ok: true, mode: "batch" });
  }

  // Legacy O(n²) path.
  const everyone = await getJoinedUsers(weekId);
  const others = everyone.filter((u) => u.uid !== uid);
  await buildAndWritePool(weekId, me, others);
  await Promise.all(others.map((other) => buildAndWritePool(weekId, other, everyone.filter((u) => u.uid !== other.uid))));
  return NextResponse.json({ ok: true, mode: "legacy", poolPeers: others.length });
}
