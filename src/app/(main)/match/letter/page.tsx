"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Envelope, WaxSeal } from "@/components/wednesday/envelope";
import { Stamp } from "@/components/wednesday/stamp";
import { getCandidate, sendLetter } from "@/lib/demo/demo-actions";
import { useDemoState, useStoreHydrated } from "@/lib/demo/demo-store";
import { DEADLINE_DAY, WEEK_DAYS } from "@/types/clock";

const MAX_LETTER_LENGTH = 900;

const STARTER_PROMPTS = [
  { label: "Something that caught my attention…", line: "Something in your postcard caught my attention — " },
  { label: "A question I want to ask…", line: "There's a question I genuinely want to ask you: " },
  { label: "A small part of my world…", line: "Here's a small part of my world I'd like to share: " }
];

export default function LetterPage() {
  const state = useDemoState();
  const router = useRouter();
  const match = state.match;
  const profile = getCandidate(match?.profileId);
  // null = untouched → show the greeting; once the user types, their text wins.
  const [draft, setDraft] = React.useState<string | null>(null);
  const body = draft ?? (profile ? `Dear ${profile.name},\n\n` : "");
  const [sealing, setSealing] = React.useState(false);
  const [posting, setPosting] = React.useState(false);
  const reduceMotion = useReducedMotion();

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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0.24, 1] }}
          className="mt-4 text-center"
        >
          <WaxSeal size={52} className="mx-auto" />
          <h1 className="letterpress mt-4 font-serif text-3xl font-semibold">This introduction is mutual</h1>
          <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">
            Two letters, one Wednesday. What happens next happens off the app — slowly, the way good things do.
          </p>
        </motion.div>
        <LetterPaper title={`You → ${profile.name}`} body={userLetter.body} day={userLetter.dayIndex} tilt="left" />
        <LetterPaper title={`${profile.name} → you`} body={matchLetter.body} day={matchLetter.dayIndex} tilt="right" accent />
        <Link href="/home" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform duration-200 active:scale-[0.98]">
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
          <div className="origin-top scale-[0.82]">
            <Envelope sealed addressee={profile.name} seed={profile.id} />
          </div>
          <h1 className="letterpress -mt-4 font-serif text-3xl font-semibold">Sealed and sent</h1>
          <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-6 text-muted-foreground">
            {profile.name} reads it today. Replies stay private until it is mutual — they arrive a day after posting.
          </p>
        </div>
        <LetterPaper title={`You → ${profile.name}`} body={userLetter.body} day={userLetter.dayIndex} />
        <Link href="/home" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform duration-200 active:scale-[0.98]">
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

  const appendPrompt = (line: string) => {
    const current = body.trimEnd();
    setDraft(`${current}\n\n${line}`);
  };

  const sealAndSend = () => {
    if (reduceMotion) {
      sendLetter(body);
      return;
    }
    setSealing(true);
    window.setTimeout(() => setPosting(true), 500);
    window.setTimeout(() => sendLetter(body), 950);
  };

  return (
    <div className="px-6 pb-10">
      <h1 className="letterpress mt-2 font-serif text-3xl font-semibold leading-tight">One letter. Make it yours.</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        No chat, no openers, no games — a single letter to introduce yourself to {profile.name}. Post it before Thursday{" "}
        {WEEK_DAYS[DEADLINE_DAY].date}.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            disabled={sealing}
            onClick={() => appendPrompt(prompt.line)}
            className="rounded-full border border-gold bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-[background-color,transform] duration-200 active:scale-[0.97] hover:bg-secondary"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <motion.div
        animate={posting ? { y: -26, scale: 0.96, opacity: 0 } : {}}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0.24, 1] }}
        className="paper-texture relative mt-4 rounded-[16px] border border-border bg-card p-5 shadow-postcard"
      >
        <div className="absolute right-4 top-4">
          <Stamp seed={state.profile.id} value="30" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {WEEK_DAYS[state.dayIndex].label}, {WEEK_DAYS[state.dayIndex].date}
        </p>
        <textarea
          value={body}
          onChange={(event) => setDraft(event.target.value.slice(0, MAX_LETTER_LENGTH))}
          rows={12}
          readOnly={sealing}
          className="letter-ruled mt-3 w-full resize-none bg-transparent font-hand text-[22px] leading-[32px] text-foreground outline-none"
          aria-label={`Your letter to ${profile.name}`}
        />
        <div className="mt-2 flex items-end justify-between">
          <p className="font-hand text-xl text-foreground/70">— {state.profile.name}</p>
          <p className="text-[11px] font-semibold tabular-nums text-muted-foreground">
            {body.length} / {MAX_LETTER_LENGTH}
          </p>
        </div>

        {/* The seal pressing onto the letter */}
        <AnimatePresence>
          {sealing ? (
            <motion.div
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0.24, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <WaxSeal size={72} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <div className="mt-4 rounded-[14px] bg-secondary px-4 py-3 text-xs leading-5 text-secondary-foreground">
        A good letter mentions something real from their postcard — {profile.name} enjoys{" "}
        {profile.interests.slice(0, 3).join(", ").toLowerCase()}, and can talk for hours about {profile.talkForHours.toLowerCase()}.
      </div>

      <Button size="lg" className="mt-5 w-full" disabled={empty || sealing} onClick={sealAndSend}>
        {sealing ? "Sealing…" : "Seal and send"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">One letter each. Replies stay private until it's mutual.</p>
    </div>
  );
}

function LetterPaper({
  title,
  body,
  day,
  accent,
  tilt
}: {
  title: string;
  body: string;
  day: number;
  accent?: boolean;
  tilt?: "left" | "right";
}) {
  return (
    <div
      className={`paper-texture relative mt-5 rounded-[16px] border p-5 shadow-postcard ${
        accent ? "border-primary/40 bg-card" : "border-border bg-card"
      } ${tilt === "left" ? "-rotate-[0.6deg]" : tilt === "right" ? "rotate-[0.6deg]" : ""}`}
    >
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
