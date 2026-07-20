import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { uidFromRequest } from "@/lib/server/data";
import { FOUNDING_CAP_PER_SIDE } from "@/lib/server/config";
import type { FoundingDoc, UserDoc } from "@/lib/app/types";

export const runtime = "nodejs";

/**
 * Claim a numbered spot in the founding cohort (500 per side, hard cap).
 *
 * The whole decision runs inside one transaction on the `system/founding`
 * ledger doc, so two people claiming the last spot can't both get it. If the
 * caller's side is full they are waitlisted — honestly, not silently.
 * Idempotent: a second call returns the original outcome unchanged.
 */
export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { gender, dateOfBirth, city } = (await req.json()) as {
    gender?: string;
    dateOfBirth?: string;
    city?: string;
  };
  if (gender !== "Male" && gender !== "Female") {
    return NextResponse.json({ error: "gender must be Male or Female" }, { status: 400 });
  }

  const db = adminDb();
  const ledgerRef = db.collection("system").doc("founding");
  const userRef = db.collection("users").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const [ledgerSnap, userSnap] = await Promise.all([tx.get(ledgerRef), tx.get(userRef)]);
    const user = userSnap.data() as UserDoc | undefined;

    // Already decided — never double-count.
    if (user?.foundingSpot) {
      return { spot: user.foundingSpot, number: user.foundingNumber ?? null, already: true };
    }

    const ledger: FoundingDoc = (ledgerSnap.data() as FoundingDoc | undefined) ?? {
      male: 0,
      female: 0,
      maleCap: FOUNDING_CAP_PER_SIDE,
      femaleCap: FOUNDING_CAP_PER_SIDE,
      updatedAt: Date.now()
    };

    const sideCount = gender === "Male" ? ledger.male : ledger.female;
    const sideCap = gender === "Male" ? ledger.maleCap : ledger.femaleCap;
    const open = sideCount < sideCap;

    // set+merge (not update) so this works even before the user doc exists.
    const profilePatch = {
      profile: {
        gender,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(city ? { city } : {})
      }
    };

    if (!open) {
      tx.set(
        userRef,
        { foundingSpot: "waitlisted", spotClaimedAt: Date.now(), updatedAt: Date.now(), ...profilePatch },
        { merge: true }
      );
      return { spot: "waitlisted" as const, number: null, already: false };
    }

    const next: FoundingDoc = {
      ...ledger,
      male: ledger.male + (gender === "Male" ? 1 : 0),
      female: ledger.female + (gender === "Female" ? 1 : 0),
      updatedAt: Date.now()
    };
    const foundingNumber = next.male + next.female; // edition number across the whole cohort

    tx.set(ledgerRef, next);
    tx.set(
      userRef,
      {
        foundingSpot: "claimed",
        foundingNumber,
        spotClaimedAt: Date.now(),
        updatedAt: Date.now(),
        ...profilePatch
      },
      { merge: true }
    );
    return { spot: "claimed" as const, number: foundingNumber, already: false };
  });

  return NextResponse.json({ ok: true, ...result });
}
