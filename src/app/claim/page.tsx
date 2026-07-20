"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChipSelect } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { RubberStamp } from "@/components/wednesday/rubber-stamp";
import { WaxSeal } from "@/components/wednesday/envelope";
import { claimFoundingSpot } from "@/lib/app/actions";
import { useAppState, useStoreHydrated } from "@/lib/app/store";
import { CITIES, GENDERS } from "@/lib/profile-options";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function isoYearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function padNo(n: number) {
  return String(n).padStart(4, "0");
}

/**
 * Claim a founding place: the three details that hold a spot (side, age, city),
 * then the moment — your edition number pressed onto the page. The full
 * profile comes after; a held spot is only introduced once it's complete.
 */
export default function ClaimPage() {
  const state = useAppState();
  const hydrated = useStoreHydrated();
  const router = useRouter();

  const [gender, setGender] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [city, setCity] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (hydrated && !state.signedIn) router.replace("/");
  }, [hydrated, state.signedIn, router]);
  if (!state.signedIn) return null;

  // ── Already decided: show the outcome, not the form ────────────────────
  if (state.foundingSpot === "claimed") {
    const step = state.setupStepReached > 1 ? Math.min(state.setupStepReached, 12) : 1;
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0.24, 1] }}
          className="paper-texture relative rounded-[22px] border border-border p-8 text-center shadow-postcard"
        >
          <RubberStamp className="absolute right-6 top-6">Founding member</RubberStamp>
          <WaxSeal size={56} className="mx-auto" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.26em] text-accent">Your place in the edition</p>
          <p className="letterpress mt-2 font-serif text-6xl font-semibold text-primary">
            Nº {state.foundingNumber ? padNo(state.foundingNumber) : "····"}
          </p>
          <p className="mx-auto mt-5 max-w-[36ch] text-sm leading-6 text-muted-foreground">
            Your spot is held. A held spot is only introduced once its profile is complete — that&apos;s what keeps
            every Wednesday worth opening.
          </p>
          <Link
            href={`/setup/${step}`}
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            {state.setupComplete ? "Review your profile" : "Complete your profile"}
          </Link>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">About 10 minutes, at your pace.</p>
        </motion.div>
      </main>
    );
  }

  if (state.foundingSpot === "waitlisted") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-6 py-16">
        <div className="paper-texture rounded-[22px] border border-border p-8 text-center shadow-postcard">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-accent">The honest answer</p>
          <h1 className="letterpress mt-3 font-serif text-3xl font-semibold leading-tight">Your side of the edition is full.</h1>
          <p className="mx-auto mt-4 max-w-[38ch] text-sm leading-6 text-muted-foreground">
            All five hundred places on your side are held. You&apos;re in line — if a place opens, it goes to the next
            person in order, and we&apos;ll write to you the moment that happens.
          </p>
          <Link
            href="/waiting"
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            See your place in line
          </Link>
        </div>
      </main>
    );
  }

  // ── The form ───────────────────────────────────────────────────────────
  const complete = gender !== "" && dateOfBirth !== "" && city !== "";

  async function submit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await claimFoundingSpot(gender, dateOfBirth, city);
    setSubmitting(false);
    if (!result) setError("That didn't go through. Check your connection and try again.");
    // On success the store updates and this page re-renders into the outcome.
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-6 py-16">
      <p className="font-hand text-2xl text-accent">Wednesday</p>
      <h1 className="letterpress mt-3 font-serif text-4xl font-semibold leading-tight">Claim your founding place</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Three details hold your numbered spot. The rest of your profile comes after, at your pace.
      </p>

      <div className="paper-texture mt-8 space-y-7 rounded-[22px] border border-border p-6 shadow-postcard">
        <div>
          <p className="mb-2.5 text-[15px] font-bold">I am</p>
          <ChipSelect options={GENDERS} value={gender} onChange={setGender} />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Places are numbered per side — five hundred each — so the room stays balanced.
          </p>
        </div>
        <div>
          <p className="mb-2.5 text-[15px] font-bold">Date of birth</p>
          <DatePicker value={dateOfBirth} min={isoYearsAgo(80)} max={isoYearsAgo(18)} onChange={setDateOfBirth} />
        </div>
        <div>
          <p className="mb-2.5 text-[15px] font-bold">City</p>
          <ChipSelect options={CITIES} value={city} onChange={setCity} />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={!complete || submitting}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lifted transition-transform duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Pressing your number…" : "Hold my place"}
      </button>
      <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
        Free to join · your details stay private until you&apos;re match-ready
      </p>
    </main>
  );
}
