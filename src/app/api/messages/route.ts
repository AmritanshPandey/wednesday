import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { chatWindow } from "@/lib/chat";
import { uidFromRequest } from "@/lib/server/data";
import type { MatchDoc, MessageDoc } from "@/lib/app/types";

export const runtime = "nodejs";

const MAX_MESSAGE = 2000;

/**
 * Post a chat message. Only allowed once a match is mutual (`connected`) and
 * while the 7-day window is still open — the same chatWindow() the UI uses, so
 * client and server never disagree about whether a conversation is closed.
 */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId, body } = (await req.json()) as { weekId: string; body: string };
  const text = (body ?? "").trim();
  if (!weekId || text.length < 1) return NextResponse.json({ error: "empty message" }, { status: 400 });
  if (text.length > MAX_MESSAGE) return NextResponse.json({ error: "too long" }, { status: 400 });

  const db = adminDb();
  const matchSnap = await db.collection("weeks").doc(weekId).collection("matches").doc(uid).get();
  const match = matchSnap.data() as MatchDoc | undefined;

  if (!match?.matchUid || !match.threadId) return NextResponse.json({ error: "no match" }, { status: 400 });
  if (match.status !== "connected") return NextResponse.json({ error: "not connected" }, { status: 409 });

  if (!chatWindow(match.connectedAt).open) {
    return NextResponse.json({ error: "chat closed" }, { status: 409 });
  }

  const message: MessageDoc = { authorUid: uid, body: text, createdAt: Date.now() };
  await db.collection("threads").doc(match.threadId).collection("messages").add(message);

  return NextResponse.json({ ok: true });
}
