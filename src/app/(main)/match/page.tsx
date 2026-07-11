"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconCoffee,
  IconInfoCircle,
  IconMailOpened,
  IconMoodSmile,
  IconPencil,
  IconUsersGroup
} from "@tabler/icons-react";
import { Dialog } from "@/components/ui/dialog";
import { Envelope } from "@/components/wednesday/envelope";
import { ProfileDetail } from "@/components/wednesday/profile-detail";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { CancellationLines, Postmark, Stamp } from "@/components/wednesday/stamp";
import { getCandidate, rankingComplete } from "@/lib/app/actions";
import { useDemoState, useStoreHydrated } from "@/lib/app/store";
import { DEADLINE_DAY, REVEAL_DAY, WEEK_DAYS } from "@/types/clock";

export default function MatchPage() {
  const state = useDemoState();
  const router = useRouter();
  const [opened, setOpened] = React.useState(false);
  const [flapOpen, setFlapOpen] = React.useState(false);
  const [showFullProfile, setShowFullProfile] = React.useState(false);

  const hydrated = useStoreHydrated();
  React.useEffect(() => {
    if (hydrated && !state.joinedWeek) router.replace("/");
  }, [hydrated, state.joinedWeek, router]);

  // Lock body scroll while the fixed-bottom card view is shown. Lives above
  // the early returns so the hook order never changes between renders.
  const cardViewVisible = Boolean(
    state.match &&
      ((state.match.status === "revealed" && opened) ||
        state.match.status === "letter_sent" ||
        state.match.status === "connected")
  );
  React.useEffect(() => {
    if (!cardViewVisible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cardViewVisible]);

  if (!state.joinedWeek) return null;

  const match = state.match;
  const profile = getCandidate(match?.profileId);

  // Before Wednesday: the envelope hasn't arrived.
  if (state.dayIndex < REVEAL_DAY || (!match && !rankingComplete(state))) {
    return (
      <CenterCard>
        <Postmark className="mx-auto h-20 w-20" />
        <h1 className="mt-4 font-serif text-3xl font-semibold">
          {state.dayIndex < REVEAL_DAY ? "Arrives Wednesday" : "Finish your ranking first"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {state.dayIndex < REVEAL_DAY
            ? `Your introduction is being allocated with everyone else's on Wednesday ${WEEK_DAYS[REVEAL_DAY].date}. One person, chosen for mutual fit.`
            : "Wednesday is here, but your ranking isn't sealed. Seal it and your introduction is allocated straight away."}
        </p>
        <Link
          href={state.dayIndex < REVEAL_DAY ? "/home" : "/rank"}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          {state.dayIndex < REVEAL_DAY ? "Back home" : "Go to ranking"}
        </Link>
      </CenterCard>
    );
  }

  if (match?.status === "no_match") {
    return (
      <CenterCard>
        <h1 className="font-serif text-3xl font-semibold">No introduction this week</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Nothing cleared the 50% compatibility floor — so instead of forcing a pairing, we kept your Wednesday quiet.
          That's a feature, not a failure.
        </p>
        <Link href="/home" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          Back home
        </Link>
      </CenterCard>
    );
  }

  if (!match || !profile) return null;

  if (match.status === "expired") {
    return (
      <CenterCard>
        <h1 className="font-serif text-3xl font-semibold">The window closed</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Thursday passed without a letter, so {profile.name}'s introduction was released. Wednesday comes around every
          week — and your ranking carries over.
        </p>
        <Link href="/home" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          Back home
        </Link>
      </CenterCard>
    );
  }

  const showEnvelope = match.status === "revealed" && !opened;
  const primaryActionLabel =
    match.status === "revealed" ? "Write back" : match.status === "connected" ? "Read letters" : "View letter";
  const statusCopy =
    match.status === "revealed"
      ? `Make your move before Thursday ${WEEK_DAYS[DEADLINE_DAY].date}.`
      : match.status === "connected"
        ? "Both letters are in. The introduction is mutual."
        : "Your letter is posted.";
  const privacyCopy =
    match.status === "connected"
      ? "The rest happens off the app, at your pace."
      : "Replies stay private until it is mutual.";

  const containerClass = showEnvelope ? "px-6 pb-[15rem]" : "min-h-screen flex px-6";

  return (
    <div className={containerClass}>
      {showEnvelope ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0.24, 1] }}
            className="paper-texture mt-8 rounded-[20px] border border-border bg-card p-8 pt-10 text-center shadow-postcard"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Wednesday, {WEEK_DAYS[REVEAL_DAY].date}
            </p>
            <div className="mt-6">
              <Envelope open={flapOpen} addressee={state.profile.name} seed={profile.id} sealed />
            </div>
            <h1 className="letterpress mt-6 font-serif text-3xl font-semibold">A thoughtful introduction</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              One person, chosen with intention — your ranking, their ranking, and a fair allocation across everyone
              this week.
            </p>
            <button
              type="button"
              disabled={flapOpen}
              onClick={() => {
                setFlapOpen(true);
                window.setTimeout(() => setOpened(true), 850);
              }}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform duration-200 active:scale-[0.98] disabled:opacity-80"
            >
              <IconMailOpened className="h-5 w-5" stroke={2} />
              {flapOpen ? "Opening…" : "Open the envelope"}
            </button>
            <p className="mt-3 text-xs font-semibold text-muted-foreground">Take your time with this one.</p>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 w-full max-w-[820px]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="rounded-full border border-border bg-card/80 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent shadow-sm">
                Posted for you
              </p>
              <Link
                href="/match/how"
                aria-label="How this match was made"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-primary shadow-sm"
              >
                <IconInfoCircle className="h-5 w-5" stroke={2} />
              </Link>
            </div>

            <div className="relative mt-5 pb-[5.25rem]">
              

              <article className="paper-texture relative z-10 overflow-hidden rounded-[18px] border border-border bg-card p-3 shadow-postcard">
                <div className="absolute -left-10 top-28 h-24 w-24 rounded-full border border-primary/10" aria-hidden />
                <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] gap-3">
                    <div className="min-w-0">
                    <ProfilePhoto
                      name={profile.name}
                      src={profile.localPhotoUrl ?? profile.photoUrl}
                      className="aspect-[4/5] w-full rounded-[10px] border-[3px] border-card shadow-sm"
                    />
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-secondary px-3 py-1 text-primary">
                        <span className="font-serif text-base font-bold leading-none">{match.compatibility}%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary/70">FIT</span>
                      </div>
                    </div>
                    <div className="mt-3 rounded-[12px] bg-card/70 px-2 pb-3 pt-2">
                      <p className="font-hand text-[1.2rem] leading-snug text-foreground/80">{profile.story}</p>
                    </div>
                  </div>

                  <div className="min-w-0 border-l border-primary/20 pl-3">
                    <div className="flex items-start justify-end gap-1.5">
                      <CancellationLines className="mt-2 hidden h-4 w-10 min-[400px]:block" />
                      <Postmark className="h-12 w-12 text-primary/45" />
                      <Stamp className="h-12 w-10" seed={profile.id} value="30" />
                    </div>

                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                      Thoughtful introduction
                    </p>
                    <h1 className="my-4 font-serif text-[2rem] font-semibold leading-none text-primary">
                      {profile.name}, <span className="text-[1.55rem] text-primary/75">{profile.age}</span>
                    </h1>
                    <div className="my-2 flex items-center text-primary/35">
                      <span className="h-px flex-1 bg-current" />
                    
                    </div>
                    <p className="text-sm font-bold leading-snug text-foreground">
                      {profile.role} <span className="text-muted-foreground">·</span> {profile.city}
                    </p>

                    <div className="mt-3 space-y-2.5">
                      <ProfileFact icon={IconUsersGroup}>{profile.intent}</ProfileFact>
                      <ProfileFact icon={IconMoodSmile}>{profile.communication}</ProfileFact>
                      <ProfileFact icon={IconCoffee}>{profile.interests.slice(0, 3).join(" · ")}</ProfileFact>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFullProfile(true)}
                        className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-full border border-gold bg-card/60 px-2 text-[12px] font-bold text-primary"
                      >
                       View Postcard
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-background/92 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
              <div className="px-2 text-center">
                <div className="flex items-center justify-center gap-3 text-accent/60">
                    <span className="h-px w-full bg-current" />

                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-foreground/85">{statusCopy}</p>
                <p className="text-sm font-semibold leading-6 text-muted-foreground">{privacyCopy}</p>
              </div>

              <div className="mt-4">
                <Link
                  href="/match/letter"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm"
                >
                  <IconPencil className="h-5 w-5" stroke={2} />
                  <span className="text-sm font-bold">{primaryActionLabel}</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      <Dialog
        open={showFullProfile}
        onOpenChange={setShowFullProfile}
        title={`${profile.name}'s postcard`}
        className="max-h-[85vh] overflow-y-auto"
        sheet
      >
        <ProfileDetail
          profile={profile}
          action={
            <Link
              href="/match/letter"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm"
            >
              <IconPencil className="h-5 w-5" stroke={2} />
              Write back
            </Link>
          }
        />
      </Dialog>
    </div>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-10">
      <div className="paper-texture mt-10 rounded-[20px] border border-border bg-card p-8 text-center shadow-postcard">{children}</div>
    </div>
  );
}

type MatchIcon = React.ComponentType<{ className?: string; stroke?: number }>;

function ProfileFact({ icon: Icon, children }: { icon: MatchIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 border-b border-dashed border-border pb-2.5 last:border-b-0 last:pb-0">
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" stroke={1.8} />
      <p className="min-w-0 text-sm font-semibold leading-snug text-foreground/85">{children}</p>
    </div>
  );
}

