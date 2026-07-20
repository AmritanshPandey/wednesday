"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { IconArrowRight, IconMailHeart, IconHourglassLow } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Envelope } from "@/components/wednesday/envelope";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { getCandidate, rankingComplete } from "@/lib/app/actions";
import { useDemoState, useStoreHydrated } from "@/lib/app/store";
import { DEADLINE_DAY, REVEAL_DAY, WEEK_DAYS } from "@/types/clock";

export default function HomePage() {
  const state = useDemoState();
  const hydrated = useStoreHydrated();
  const router = useRouter();

  React.useEffect(() => {
    if (hydrated && !state.joinedWeek) router.replace("/");
  }, [hydrated, state.joinedWeek, router]);

  // Pre-launch: joined but no pool and no match means the market hasn't gone
  // live yet — the waiting room is the honest screen, not an empty week.
  const preLaunch = hydrated && state.joinedWeek && state.pool.length === 0 && !state.match;
  React.useEffect(() => {
    if (!preLaunch) return;
    let alive = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { launched?: boolean } | null) => {
        if (alive && s && !s.launched) router.replace("/waiting");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [preLaunch, router]);

  if (!state.joinedWeek) return null;

  const day = WEEK_DAYS[state.dayIndex];
  const ranked = rankingComplete(state);
  const poolRounds = state.rounds.filter((round) => !round.isFinal);
  const expectedRounds = poolRounds.length + (poolRounds.length > 1 ? 1 : 0);
  const submittedRounds = state.rounds.filter((round) => round.submitted).length;
  const match = state.match;
  const matchProfile = getCandidate(match?.profileId);

  return (
    <div className="space-y-5 px-6 pb-8 sm:space-y-6">
      <p className="text-sm font-semibold text-muted-foreground">
        {day.label}, {day.date}
      </p>

      {match && match.status !== "no_match" && matchProfile ? (
        <MatchCard status={match.status} name={matchProfile.name} photo={matchProfile.photoUrl} compatibility={match.compatibility} />
      ) : match && match.status === "no_match" ? (
        <HeroCard
          icon={<IconMailHeart className="h-6 w-6 text-accent" stroke={1.8} />}
          title="No introduction this week"
          body="Nothing cleared the 50% compatibility floor, so we didn't force a pairing. Your profile stays in next week's allocation."
        />
      ) : state.dayIndex >= REVEAL_DAY && !ranked ? (
        <HeroCard
          icon={<IconHourglassLow className="h-6 w-6 text-accent" stroke={1.8} />}
          title="Wednesday is here — finish your ranking"
          body="Your introduction is allocated the moment your ranking is sealed."
          action={{ href: "/rank", label: "Finish ranking" }}
        />
      ) : ranked ? (
        <WaitingCard revealDate={WEEK_DAYS[REVEAL_DAY].date} daysAway={Math.max(0, REVEAL_DAY - state.dayIndex)} />
      ) : (
        <HeroCard
          icon={<IconMailHeart className="h-6 w-6 text-accent" stroke={1.8} />}
          title={`We found ${state.pool.length} people aligned with your essentials`}
          body="Every one of them clears your deal-breakers — and you clear theirs. Rank them five at a time, most excited first."
          action={{ href: "/rank", label: submittedRounds > 0 ? "Continue ranking" : "Start ranking" }}
        />
      )}

      {!ranked ? (
        <section className="rounded-[18px] border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Ranking progress</h2>
            <Badge>
              {submittedRounds} / {expectedRounds} rounds
            </Badge>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: expectedRounds }).map((_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full ${index < submittedRounds ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Five at a time, then a final round of your round winners. Your order becomes your voice in the Wednesday
            allocation.
          </p>
        </section>
      ) : null}

      <section className="rounded-[18px] border border-border bg-card p-4">
        <h2 className="font-bold">How this week works</h2>
        <ol className="mt-3 space-y-3">
          <TimelineRow
            done={ranked}
            current={!ranked && state.dayIndex < REVEAL_DAY}
            day="Thu – Tue"
            title="Review & rank your pool"
            detail="Take your time. Profiles, not photos."
          />
          <TimelineRow
            done={Boolean(match)}
            current={state.dayIndex === REVEAL_DAY && !match}
            day={`Wed ${WEEK_DAYS[REVEAL_DAY].date}`}
            title="Your introduction is revealed"
            detail="One person, chosen by mutual fit — not by who swiped."
          />
          <TimelineRow
            done={Boolean(match && (match.status === "letter_sent" || match.status === "connected"))}
            current={Boolean(match && match.status === "revealed")}
            day={`Thu ${WEEK_DAYS[DEADLINE_DAY].date}`}
            title="Make your move"
            detail="One letter to introduce yourself. Posted by Thursday."
          />
        </ol>
        <Link href="/how" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
          How matching works
          <IconArrowRight className="h-4 w-4" stroke={2.4} />
        </Link>
      </section>
    </div>
  );
}

function HeroCard({
  icon,
  title,
  body,
  action
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="paper-texture rounded-[20px] border border-border bg-card p-4 shadow-postcard">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">{icon}</div>
      <h1 className="letterpress mt-3 font-serif text-2xl font-semibold leading-snug">{title}</h1>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform duration-200 active:scale-[0.98]"
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}

/** The calm sealed-envelope waiting state between ranking and Wednesday. */
function WaitingCard({ revealDate, daysAway }: { revealDate: string; daysAway: number }) {
  return (
    <section className="paper-texture rounded-[20px] border border-border bg-card px-4 pb-5 pt-6 text-center shadow-postcard">
      <div className="scale-[0.85]">
        <Envelope sealed addressee="you" />
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
        {daysAway === 0 ? "Arriving today" : daysAway === 1 ? "One day away" : `${daysAway} days away`}
      </p>
      <h1 className="letterpress mt-2 font-serif text-2xl font-semibold leading-snug">
        Your next thoughtful introduction arrives Wednesday
      </h1>
      <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">
        Your ranking is sealed. Everyone&apos;s preferences meet in one allocation on Wednesday {revealDate} — like a
        letter already in the mail.
      </p>
    </section>
  );
}

function MatchCard({
  status,
  name,
  photo,
  compatibility
}: {
  status: string;
  name: string;
  photo?: string;
  compatibility: number;
}) {
  const copy: Record<string, { title: string; body: string; cta: string; href: string }> = {
    revealed: {
      title: `Meet ${name}`,
      body: `Your Wednesday introduction is here — ${compatibility}% aligned. You have until Thursday to make your move.`,
      cta: "Open your introduction",
      href: "/match"
    },
    letter_sent: {
      title: "Your letter is in the mail",
      body: `${name} will read it soon. Replies arrive a day after posting.`,
      cta: "View your letter",
      href: "/match/letter"
    },
    connected: {
      title: `You and ${name} are connected`,
      body: "Both letters have been exchanged. The rest is yours to write — off the app, at your own pace.",
      cta: "Read the letters",
      href: "/match/letter"
    },
    expired: {
      title: "The window closed",
      body: `Thursday passed without a letter. ${name}'s introduction has been released — next Wednesday is a fresh start.`,
      cta: "See what happened",
      href: "/match"
    }
  };
  const item = copy[status] ?? copy.revealed;

  return (
    <section className="paper-texture relative overflow-hidden rounded-[20px] border border-border bg-card p-5 shadow-postcard">
      <div className="flex items-center gap-4">
        <ProfilePhoto name={name} src={photo} className="h-20 w-16 shrink-0 rounded-[10px] border-4 border-card shadow-sm" />
        <div className="min-w-0">
          <h1 className="letterpress font-serif text-2xl font-semibold leading-snug">{item.title}</h1>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
      <Link
        href={item.href}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/92"
      >
        {item.cta}
      </Link>
    </section>
  );
}

function TimelineRow({
  done,
  current,
  day,
  title,
  detail
}: {
  done: boolean;
  current: boolean;
  day: string;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${
          done ? "border-primary bg-primary" : current ? "border-accent bg-secondary" : "border-input bg-card"
        }`}
        aria-hidden
      />
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{day}</p>
        <p className={`text-sm font-bold ${done ? "text-muted-foreground line-through" : ""}`}>{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
