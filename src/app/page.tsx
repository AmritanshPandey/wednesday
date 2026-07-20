"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IconArrowDown, IconBrandGoogleFilled } from "@tabler/icons-react";
import { Envelope } from "@/components/wednesday/envelope";
import { CancellationLines, Postmark, Stamp } from "@/components/wednesday/stamp";
import { FoundingCounters, useFoundingStats } from "@/components/landing/founding-counters";
import { signInWithGoogle, useAppState } from "@/lib/app/store";

// The Three.js hero loads lazily on the client only — the page never waits on it.
const LandingHeroCanvas = dynamic(() => import("@/components/landing/landing-hero-canvas"), { ssr: false });

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.32, 0.72, 0.24, 1] as const }
};

function padNo(n: number): string {
  return String(n).padStart(4, "0");
}

/** The one primary action, resolved from where this person actually is. */
function PrimaryCta({
  large,
  state,
  launched,
  signingIn,
  onSignIn
}: {
  large?: boolean;
  state: ReturnType<typeof useAppState>;
  launched: boolean | undefined;
  signingIn: boolean;
  onSignIn: () => void;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-lifted transition-transform duration-200 active:scale-[0.98] ${
    large ? "h-14 px-8 text-base" : "h-12 px-6 text-sm"
  }`;
  if (!state.configured) {
    return (
      <p className="rounded-[14px] bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground">
        Firebase isn&apos;t configured yet — copy .env.local.example and fill it in.
      </p>
    );
  }
  if (!state.authReady) return <div className={`${cls} w-56 animate-pulse bg-muted text-transparent`}>.</div>;
  if (!state.signedIn) {
    return (
      <button type="button" onClick={onSignIn} disabled={signingIn} className={cls}>
        <IconBrandGoogleFilled className="h-5 w-5" />
        {signingIn ? "Opening Google…" : "Claim your place"}
      </button>
    );
  }
  if (!state.foundingSpot) {
    return (
      <Link href="/claim" className={cls}>
        Claim your place
      </Link>
    );
  }
  if (state.foundingSpot === "waitlisted") {
    return (
      <Link href="/waiting" className={cls}>
        See your place in line
      </Link>
    );
  }
  if (!state.setupComplete) {
    const step = state.setupStepReached > 1 ? Math.min(state.setupStepReached, 12) : 1;
    return (
      <Link href={`/setup/${step}`} className={cls}>
        Complete your profile
      </Link>
    );
  }
  if (!state.joinedWeek) {
    return (
      <Link href="/setup/review" className={cls}>
        Join this week
      </Link>
    );
  }
  return (
    <Link href={launched ? "/home" : "/waiting"} className={cls}>
      {launched ? "Continue to your week" : "Your envelope is waiting"}
    </Link>
  );
}

export default function LandingPage() {
  const state = useAppState();
  const router = useRouter();
  const stats = useFoundingStats();
  const [signingIn, setSigningIn] = React.useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      router.push("/claim");
    } catch {
      setSigningIn(false);
    }
  }

  const cta = { state, launched: stats?.launched, signingIn, onSignIn: handleSignIn };
  const heldNumber = state.foundingSpot === "claimed" && state.foundingNumber ? padNo(state.foundingNumber) : null;

  return (
    <main className="relative text-foreground">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 lg:px-12">
        <p className="font-hand text-2xl text-accent">Wednesday</p>
        <Link
          href="/how"
          className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-bold text-foreground backdrop-blur transition hover:bg-secondary"
        >
          How matching works
        </Link>
      </header>

      {/* ── Act I · the thesis ───────────────────────────────────────── */}
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
        <LandingHeroCanvas />
        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-6 pb-24 pt-28 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
            className="max-w-[640px]"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-accent">
              A dating concept, delivered like post
            </p>
            <h1 className="letterpress mt-5 font-serif text-[clamp(2.9rem,7.5vw,5.6rem)] font-semibold leading-[0.98]">
              One introduction.
              <br />
              Every Wednesday.
            </h1>
            <p className="mt-6 max-w-[46ch] text-base font-medium leading-7 text-foreground/90 sm:text-lg sm:leading-8">
              No swiping, no feeds, no games. Five hundred men and five hundred women, matched with intention — one
              considered introduction a week, sealed on Tuesday and opened together on Wednesday morning.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PrimaryCta large {...cta} />
              {heldNumber ? <p className="text-sm font-bold text-muted-foreground">Nº {heldNumber} is held for you</p> : null}
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary/40">
          <IconArrowDown className="h-5 w-5 animate-bounce" stroke={2} />
        </div>
      </section>

      {/* ── Act II · the week, as a postal timeline ──────────────────── */}
      <section className="relative mx-auto max-w-[1120px] px-6 py-24 lg:px-12">
        <motion.div {...reveal} className="max-w-[560px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-accent">The weekly cycle</p>
          <h2 className="letterpress mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            A week with a rhythm, not a feed.
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <motion.article {...reveal} className="paper-texture rounded-[20px] border border-border p-7 shadow-postcard">
            <div className="flex items-start justify-between">
              <p className="font-serif text-xl text-primary">Thursday</p>
              <Stamp className="h-14 w-12" seed="landing-thu" />
            </div>
            <h3 className="mt-5 font-serif text-2xl leading-snug">Your pool arrives</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Up to twenty-five people who clear your must-haves and share real ground with you — chosen by fit, never
              by who pays.
            </p>
          </motion.article>

          <motion.article
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.08 }}
            className="paper-texture rounded-[20px] border border-border p-7 shadow-postcard"
          >
            <div className="flex items-start justify-between">
              <p className="font-serif text-xl text-primary">Tuesday</p>
              <Postmark className="h-14 w-14" />
            </div>
            <h3 className="mt-5 font-serif text-2xl leading-snug">Seal your ranking</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Order your favourites at your own pace through the week, then seal it. No messages yet — nobody performs.
            </p>
          </motion.article>

          <motion.article
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.16 }}
            className="paper-texture rounded-[20px] border border-border p-7 shadow-postcard"
          >
            <div className="flex items-start justify-between">
              <p className="font-serif text-xl text-primary">Wednesday</p>
              <CancellationLines className="mt-2 h-5 w-14" />
            </div>
            <h3 className="mt-5 font-serif text-2xl leading-snug">One envelope opens</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Everyone&apos;s rankings meet in one fair allocation, and each person receives a single introduction —
              with one letter to begin.
            </p>
          </motion.article>
        </div>

        <motion.p
          {...reveal}
          className="mx-auto mt-12 max-w-[52ch] text-center font-serif text-lg italic leading-8 text-foreground/70"
        >
          The mathematics are stable matching — the same idea that pairs doctors with hospitals — tuned so an
          introduction only happens when it works for both people.
        </motion.p>
      </section>

      {/* ── Act III · the founding thousand ──────────────────────────── */}
      <section className="relative border-y border-border/70 bg-card/40 py-24">
        <div className="mx-auto max-w-[1120px] px-6 lg:px-12">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
            <motion.div {...reveal}>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-accent">A numbered edition</p>
              <h2 className="letterpress mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                The founding thousand.
              </h2>
              <p className="mt-5 max-w-[46ch] text-base leading-7 text-foreground/75">
                Wednesday opens with exactly one thousand members — five hundred men, five hundred women — because a
                fair match needs both sides present in equal measure. Every founding member holds a numbered place;
                when a side fills, it closes.
              </p>
              <div className="mt-7">
                <PrimaryCta {...cta} />
              </div>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <FoundingCounters stats={stats} />
              <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">
                Live count · the first envelopes open once both sides are ready
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Act IV · the invitation ──────────────────────────────────── */}
      <section className="relative mx-auto max-w-[720px] px-6 py-24 text-center lg:px-12">
        <motion.div {...reveal}>
          <div className="pointer-events-none mx-auto origin-top scale-[0.85]">
            <Envelope sealed addressee="you" seed="landing-final" />
          </div>
          <h2 className="letterpress -mt-2 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Your envelope is waiting to be addressed.
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-base leading-7 text-foreground/75">
            Claim a founding place, tell us who you are, and be there the morning the first introductions open.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta large {...cta} />
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/70 px-6 py-8 text-center">
        <p className="font-hand text-xl text-accent">Wednesday</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          Thoughtful introductions, every Wednesday · Delhi NCR · Mumbai · Pune · Bangalore
        </p>
      </footer>
    </main>
  );
}
