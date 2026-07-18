import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { computeWeekClock } from "@/lib/week";
import { uidFromRequest } from "@/lib/server/data";
import type { MatchDoc } from "@/lib/app/types";

export const runtime = "nodejs";

const DEV = process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";
const MAX_LETTER = 1200;

/** Post the one introduction letter. Enforces: valid revealed match, one
 *  letter per person, and (in production) the Thursday deadline. When both
 *  sides have written, the introduction becomes mutual. */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { weekId, body } = (await req.json()) as { weekId: string; body: string };
  const text = (body ?? "").trim();
  if (!weekId || text.length < 5) return NextResponse.json({ error: "empty letter" }, { status: 400 });
  if (text.length > MAX_LETTER) return NextResponse.json({ error: "too long" }, { status: 400 });

  if (!DEV && computeWeekClock().msToDeadline <= 0) {
    return NextResponse.json({ error: "deadline passed" }, { status: 409 });
  }

  const db = adminDb();
  const weekRef = db.collection("weeks").doc(weekId);
  const myMatchSnap = await weekRef.collection("matches").doc(uid).get();
  const myMatch = myMatchSnap.data() as MatchDoc | undefined;

  if (!myMatch?.matchUid || !myMatch.threadId) {
    return NextResponse.json({ error: "no match" }, { status: 400 });
  }
  if (myMatch.status !== "revealed" && myMatch.status !== "letter_sent" && myMatch.status !== "connected") {
    return NextResponse.json({ error: "not writable" }, { status: 409 });
  }

  const threadRef = db.collection("threads").doc(myMatch.threadId);
  const lettersRef = threadRef.collection("letters");

  const mine = await lettersRef.where("authorUid", "==", uid).limit(1).get();
  if (!mine.empty) return NextResponse.json({ error: "already sent" }, { status: 409 });

  await lettersRef.add({ authorUid: uid, body: text, createdAt: Date.now() });

  // Did the other person already write? Then it's mutual.
  const theirs = await lettersRef.where("authorUid", "==", myMatch.matchUid).limit(1).get();
  const mutual = !theirs.empty;

  const otherRef = weekRef.collection("matches").doc(myMatch.matchUid);
  if (mutual) {
    // Both letters are in: open the 7-day chat window. connectedAt is the
    // clock start; the activeChat pointer keeps the chat reachable after the
    // next Wednesday's match arrives. Each side's pointer denormalizes the
    // OTHER person's name/photo so the header renders without an extra read —
    // myMatch.profile is matchUid's card; otherMatch.profile is mine.
    const connectedAt = Date.now();
    const otherMatch = (await otherRef.get()).data() as MatchDoc | undefined;
    const display = (p: MatchDoc["profile"]) => ({
      matchName: p?.name ?? "your match",
      matchPhotoUrl: p?.localPhotoUrl ?? p?.photoUrl ?? null
    });
    const base = { threadId: myMatch.threadId, weekId, connectedAt };
    const meActiveChat = { ...base, matchUid: myMatch.matchUid, ...display(myMatch.profile) };
    const otherActiveChat = { ...base, matchUid: uid, ...display(otherMatch?.profile ?? null) };
    await Promise.all([
      myMatchSnap.ref.set({ status: "connected", connectedAt }, { merge: true }),
      otherRef.set({ status: "connected", connectedAt }, { merge: true }),
      db.collection("users").doc(uid).set({ activeChat: meActiveChat, updatedAt: connectedAt }, { merge: true }),
      db.collection("users").doc(myMatch.matchUid).set({ activeChat: otherActiveChat, updatedAt: connectedAt }, { merge: true })
    ]);
  } else {
    await myMatchSnap.ref.set({ status: "letter_sent" }, { merge: true });
  }

  return NextResponse.json({ ok: true, mutual });
}
