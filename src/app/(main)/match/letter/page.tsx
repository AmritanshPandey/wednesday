"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IconMailForward } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/wednesday/stamp";
import { getCandidate, sendLetter } from "@/lib/demo/demo-actions";
import { useDemoState, useStoreHydrated } from "@/lib/demo/demo-store";
import { DEADLINE_DAY, WEEK_DAYS } from "@/types/clock";

const RULED_LINES: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(0,79,59,0.12) 31px, rgba(0,79,59,0.12) 32px)"
};

export default function LetterPage() {
  const state = useDemoState();
  const router = useRouter();
  const match = state.match;
  const profile = getCandidate(match?.profileId);
  // null = untouched → show the greeting; once the user types, their text wins.
  const [draft, setDraft] = React.useState<string | null>(null);
  const body = draft ?? (profile ? `Dear ${profile.name},\n\n` : "");
  const [posting, setPosting] = React.useState(false);

  const hydrated = useStoreHydrated();
  React.useEffect(() => {
    if (hydrated && (!match || !profile)) router.replace("/match");
  }, [hydrated, match, profile, router]);

  if (!match || !profile) return null;

  const userLetter = state.letters.find((letter) => letter.author === "user");
  const matchLetter = state.letters.find((letter) => letter.author === "match");

  // ---- Connected: both letters, side by side story ------------------------
  if (match.status === "connected" && userLetter && matchLetter) {
    return (
      <div className="px-6 pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-center">
          <p className="text-3xl">💌</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">A connection, made</h1>
          <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">
            Two letters, one Wednesday. What happens next happens off the app — slowly, the way good things do.
          </p>
        </motion.div>
        <LetterPaper title={`You → ${profile.name}`} body={userLetter.body} day={userLetter.dayIndex} />
        <LetterPaper title={`${profile.name} → you`} body={matchLetter.body} day={matchLetter.dayIndex} accent />
        <Link href="/home" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          Back home
        </Link>
      </div>
    );
  }

  // ---- Letter sent: waiting for the reply ---------------------------------
  if (match.status === "letter_sent" && userLetter) {
    return (
      <div className="px-6 pb-10">
        <div className="mt-2 text-center">
          <motion.p initial={{ y: 0 }} animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 2.6 }} className="text-3xl">
            📮
          </motion.p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Your letter is in the mail</h1>
          <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-6 text-muted-foreground">
            {profile.name} reads it today. Replies arrive a day after posting — move the demo clock forward to see it
            land.
          </p>
        </div>
        <LetterPaper title={`You → ${profile.name}`} body={userLetter.body} day={userLetter.dayIndex} />
        <Link href="/home" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          Back home
        </Link>
      </div>
    );
  }

  // ---- Expired or otherwise not writable ----------------------------------
  if (match.status !== "revealed") {
    return (
      <div className="px-6 pb-10">
        <div className="paper-texture mt-10 rounded-[20px] border border-border bg-card p-8 text-center shadow-postcard">
          <h1 className="font-serif text-3xl font-semibold">This letter can't be written</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">The Thursday window has passed. Next Wednesday is a fresh start.</p>
          <Link href="/home" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  // ---- Compose -------------------------------------------------------------
  const empty = body.replace(`Dear ${profile.name},`, "").trim().length < 10;

  return (
    <div className="px-6 pb-10">
      <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight">One letter. Make it yours.</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        No chat, no openers, no games — a single letter to introduce yourself to {profile.name}. Post it before Thursday{" "}
        {WEEK_DAYS[DEADLINE_DAY].date}.
      </p>

      <motion.div
        animate={posting ? { y: -520, opacity: 0, rotate: -3 } : {}}
        transition={{ duration: 0.7, ease: "easeIn" }}
        className="paper-texture relative mt-5 rounded-[16px] border border-border bg-card p-5 shadow-postcard"
      >
        <div className="absolute right-4 top-4">
          <Stamp value="W" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {WEEK_DAYS[state.dayIndex].label}, {WEEK_DAYS[state.dayIndex].date}
        </p>
        <textarea
          value={body}
          onChange={(event) => setDraft(event.target.value)}
          rows={12}
          style={RULED_LINES}
          className="mt-3 w-full resize-none bg-transparent font-hand text-[22px] leading-[32px] text-foreground outline-none"
          aria-label={`Your letter to ${profile.name}`}
        />
        <p className="mt-2 text-right font-hand text-xl text-foreground/70">— {state.profile.name}</p>
      </motion.div>

      <div className="mt-4 rounded-[14px] bg-secondary px-4 py-3 text-xs leading-5 text-secondary-foreground">
        A good letter mentions something real from their postcard — {profile.name} enjoys{" "}
        {profile.interests.slice(0, 3).join(", ").toLowerCase()}, and can talk for hours about {profile.talkForHours.toLowerCase()}.
      </div>

      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={empty || posting}
        onClick={() => {
          setPosting(true);
          window.setTimeout(() => {
            sendLetter(body);
          }, 750);
        }}
      >
        <IconMailForward className="h-5 w-5" stroke={2} />
        {posting ? "Posting…" : "Post my letter"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">One letter each. Replies stay private until it's mutual.</p>
    </div>
  );
}

function LetterPaper({ title, body, day, accent }: { title: string; body: string; day: number; accent?: boolean }) {
  return (
    <div className={`paper-texture relative mt-5 rounded-[16px] border p-5 shadow-postcard ${accent ? "border-primary/40 bg-card" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{title}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {WEEK_DAYS[day].label}, {WEEK_DAYS[day].date}
        </p>
      </div>
      <p className="mt-3 whitespace-pre-wrap font-hand text-[21px] leading-[30px] text-foreground/90">{body}</p>
    </div>
  );
}
