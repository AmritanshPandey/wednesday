"use client";

import Link from "next/link";
import { Callout } from "@/components/setup/step-shell";
import { useDemoState } from "@/lib/demo/demo-store";

function PostcardsIllustration() {
  return (
    <svg viewBox="0 0 320 180" className="mx-auto w-full max-w-[320px]" aria-hidden>
      <g transform="rotate(-8 90 110)">
        <rect x="30" y="70" width="120" height="80" rx="8" fill="#004F3B" />
        <rect x="40" y="52" width="104" height="72" rx="6" fill="#FFFDF6" stroke="#ECE2C9" />
        <rect x="48" y="60" width="34" height="26" rx="3" fill="#DCE7DF" />
        <circle cx="65" cy="70" r="6" fill="#E6C65E" />
        <path d="M48 86 q 17 -10 34 0 v 0 h -34 z" fill="#004F3B" opacity="0.55" />
        <line x1="92" y1="66" x2="134" y2="66" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
        <line x1="92" y1="76" x2="134" y2="76" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
        <line x1="92" y1="86" x2="126" y2="86" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="rotate(7 240 100)">
        <rect x="180" y="66" width="120" height="80" rx="8" fill="#E17100" />
        <rect x="190" y="48" width="104" height="72" rx="6" fill="#FFFDF6" stroke="#ECE2C9" />
        <rect x="198" y="56" width="34" height="26" rx="3" fill="#F6E3C8" />
        <circle cx="215" cy="66" r="6" fill="#E6C65E" />
        <path d="M198 82 q 17 -12 34 0 v 0 h -34 z" fill="#E17100" opacity="0.5" />
        <line x1="242" y1="62" x2="284" y2="62" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
        <line x1="242" y1="72" x2="284" y2="72" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
        <line x1="242" y1="82" x2="276" y2="82" stroke="#ECE2C9" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path
        d="M150 60 q 10 -18 20 -6 q 10 -12 18 4 q -8 14 -18 18 q -12 -4 -20 -16 z"
        fill="none"
        stroke="#E17100"
        strokeWidth="2"
        strokeLinecap="round"
        transform="translate(-4 -14) scale(0.9)"
      />
    </svg>
  );
}

export default function WelcomePage() {
  const state = useDemoState();
  const started = state.setupStepReached > 1 && !state.setupComplete;

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col px-6 pb-10 pt-14">
      <p className="font-hand text-2xl text-accent">Wednesday</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-[1.15]">Build a profile people can understand.</h1>
      <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
        A few thoughtful details help us find people aligned with your intentions, lifestyle, and future. One
        introduction, every Wednesday — no endless swiping.
      </p>

      <div className="my-8">
        <PostcardsIllustration />
      </div>

      <Callout title="Will take about 10 minutes">
        Private until you're match-ready
        <br />
        You can edit anything later
      </Callout>

      <div className="mt-auto space-y-3 pt-8">
        {state.setupComplete ? (
          <Link
            href="/home"
            className="flex h-13 min-h-12 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-sm transition hover:bg-primary/92"
          >
            Continue to your week
          </Link>
        ) : (
          <Link
            href={started ? `/setup/${Math.min(state.setupStepReached, 11)}` : "/setup/1"}
            className="flex h-13 min-h-12 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-sm transition hover:bg-primary/92"
          >
            {started ? "Continue my profile" : "Start my Profile"}
          </Link>
        )}
        <Link
          href="/how"
          className="flex h-13 min-h-12 w-full items-center justify-center rounded-full border border-accent text-base font-bold text-accent transition hover:bg-secondary"
        >
          How matching works
        </Link>
      </div>
    </main>
  );
}
