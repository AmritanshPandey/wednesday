import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { uidFromRequest } from "@/lib/server/data";
import type { OutcomeEventType } from "@/lib/app/types";

export const runtime = "nodejs";

const EVENT_TYPES = new Set<OutcomeEventType>([
  "accepted",
  "chat_started",
  "first_reply",
  "photo_exchanged",
  "number_exchanged",
  "met",
  "still_chatting_30d"
]);

/**
 * Records a post-introduction outcome event for the signed-in user. Append-only
 * — this is the eventual training signal for a learned compatibility model
 * (Part 11). Nothing consumes it yet; capturing it now builds the dataset.
 */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId, type, matchUid } = (await req.json()) as {
    weekId?: string;
    type?: OutcomeEventType;
    matchUid?: string;
  };
  if (!weekId) return NextResponse.json({ error: "weekId required" }, { status: 400 });
  if (!type || !EVENT_TYPES.has(type)) return NextResponse.json({ error: "invalid event type" }, { status: 400 });

  const ref = adminDb().collection("outcomes").doc(weekId).collection("uid").doc(uid);
  await ref.set(
    {
      uid,
      weekId,
      matchUid: matchUid ?? null,
      events: FieldValue.arrayUnion({ type, ts: Date.now() }),
      updatedAt: Date.now()
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}
