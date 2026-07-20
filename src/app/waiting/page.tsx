"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Envelope } from "@/components/wednesday/envelope";
import { RubberStamp } from "@/components/wednesday/rubber-stamp";
import { FoundingCounters, useFoundingStats } from "@/components/landing/founding-counters";
import { useAppState, useStoreHydrated } from "@/lib/app/store";

function padNo(n: number) {
  return String(n).padStart(4, "0");
}

/**
 * The waiting room: the stretch between holding a founding place and the
 * first Wednesday. The wait is the product working — the room fills until
 * both sides can sustain a fair week, then the first envelopes go out.
 */
export default function WaitingPage() {
  const state = useAppState();
  const hydrated = useStoreHydrated();
  const router = useRouter();
  const stats = useFoundingStats();

  React.useEffect(() => {
    if (hydrated && !state.signedIn) router.replace("/");
  }, [hydrated, state.signedIn, router]);

  // The moment the market can sustain a weekly cycle, the wait is over.
  React.useEffect(() => {
    if (stats?.launched && state.joinedWeek) router.replace("/home");
  }, [stats?.launched, state.joinedWeek, router]);

  if (!state.signedIn) return null;

  const claimed = state.foundingSpot === "claimed";
  const profileDone = state.setupComplete;
  const step = state.setupStepReached > 1 ? Math.min(state.setupStepReached, 12) : 1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-6 pb-16 pt-12">
      <div className="flex items-center justify-between">
        <p className="font-hand text-2xl text-accent">Wednesday</p>
        {claimed && state.foundingNumber ? <RubberStamp animate={false}>Nº {padNo(state.foundingNumber)}</RubberStamp> : null}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0.24, 1] }}
        className="mt-10 text-center"
      >
        <div className="pointer-events-none mx-auto origin-top scale-[0.8]">
          <Envelope sealed addressee={state.profile.name || "you"} seed={state.uid ?? "waiting"} />
        </div>
        <h1 className="letterpress -mt-3 font-serif text-4xl font-semibold leading-tight">
          {claimed ? "The room is filling." : "You're in line."}
        </h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-sm leading-7 text-muted-foreground">
          {claimed
            ? "Your envelope is sealed and waiting. The first introductions go out the week both sides are ready — no forced matches, no empty rooms."
            : "Your side of the founding edition is full, but places do open. You'll hear from us the moment one does."}
        </p>
      </motion.div>

      <div className="mt-10">
        <FoundingCounters stats={stats} />
        <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
          {stats ? `${stats.total} of ${stats.totalCap} founding members are in` : "Counting the room…"}
        </p>
      </div>

      {claimed && !profileDone ? (
        <div className="paper-texture mt-8 rounded-[18px] border border-primary/40 p-5 shadow-postcard">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">While you wait</p>
          <p className="mt-2 font-serif text-xl leading-snug">A held place is only introduced once its profile is complete.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Finish yours now and you&apos;re in the very first allocation the moment the room is ready.
          </p>
          <Link
            href={`/setup/${step}`}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            Complete your profile
          </Link>
        </div>
      ) : null}

      <div className="mt-10 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What happens next</p>
        {[
          ["The room fills", "Founding members join until both sides can sustain a fair week."],
          ["A Thursday arrives", "Your pool of up to twenty-five appears, and the ranking week begins."],
          ["The first Wednesday", "Everyone's envelopes open at nine in the morning, together."]
        ].map(([title, body], i) => (
          <div key={title} className="flex gap-4 border-b border-dashed border-border pb-4 last:border-b-0">
            <p className="font-serif text-lg text-primary/60">{i + 1}</p>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center font-serif text-sm italic leading-6 text-muted-foreground">
        Good introductions are worth a short wait.
      </p>
    </main>
  );
}
