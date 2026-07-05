"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBookmark,
  IconCoffee,
  IconHeart,
  IconHeartHandshake,
  IconInfoCircle,
  IconMailOpened,
  IconMoodSmile,
  IconPencil,
  IconUsersGroup,
  IconX
} from "@tabler/icons-react";
import { Dialog } from "@/components/ui/dialog";
import { ProfileDetail } from "@/components/wednesday/profile-detail";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { CancellationLines, Postmark, Stamp } from "@/components/wednesday/stamp";
import { getCandidate, rankingComplete } from "@/lib/demo/demo-actions";
import { useDemoState, useStoreHydrated } from "@/lib/demo/demo-store";
import { DEADLINE_DAY, REVEAL_DAY, WEEK_DAYS } from "@/types/clock";
import type { Profile } from "@/types/profile";

export default function MatchPage() {
  const state = useDemoState();
  const router = useRouter();
  const [opened, setOpened] = React.useState(false);
  const [showFullProfile, setShowFullProfile] = React.useState(false);

  const hydrated = useStoreHydrated();
  React.useEffect(() => {
    if (hydrated && !state.joinedWeek) router.replace("/");
  }, [hydrated, state.joinedWeek, router]);
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
  const previewProfiles = state.pool
    .map((entry) => getCandidate(entry.profileId))
    .filter((candidate): candidate is Profile => Boolean(candidate && candidate.id !== profile.id))
    .slice(0, 2);
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

  return (
    <div className="px-6 pb-[15rem]">
      <AnimatePresence mode="wait">
        {showEnvelope ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="paper-texture mt-8 rounded-[20px] border border-border bg-card p-8 text-center shadow-postcard"
          >
            <motion.div
              animate={{ rotate: [0, -2, 2, -1, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="mx-auto flex h-40 w-56 items-center justify-center rounded-[10px] bg-primary shadow-soft"
            >
              <div className="relative flex h-[8.5rem] w-52 items-center justify-center rounded-[8px] bg-card">
                <Stamp className="absolute right-2 top-2" value="30" />
                <CancellationLines className="absolute left-3 top-5" />
                <p className="font-hand text-2xl text-primary">For {state.profile.name}</p>
              </div>
            </motion.div>
            <h1 className="mt-6 font-serif text-3xl font-semibold">Your Wednesday introduction is here</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              One person. Chosen with your ranking, their ranking, and a fair allocation across everyone this week.
            </p>
            <button
              type="button"
              onClick={() => setOpened(true)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground"
            >
              <IconMailOpened className="h-5 w-5" stroke={2} />
              Open the envelope
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="pt-2"
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
              {previewProfiles[1] ? (
                <MiniPostcard profile={previewProfiles[1]} className="absolute inset-x-9 bottom-0 z-0 rotate-[-1.5deg]" />
              ) : null}
              {previewProfiles[0] ? (
                <MiniPostcard profile={previewProfiles[0]} className="absolute inset-x-5 bottom-9 z-0 rotate-[1.5deg]" />
              ) : null}

              <article className="paper-texture relative z-10 overflow-hidden rounded-[18px] border border-border bg-card p-3 shadow-postcard">
                <div className="absolute -left-10 top-28 h-24 w-24 rounded-full border border-primary/10" aria-hidden />
                <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] gap-3">
                  <div className="min-w-0">
                    <ProfilePhoto
                      name={profile.name}
                      src={profile.localPhotoUrl ?? profile.photoUrl}
                      className="aspect-[4/5] w-full rounded-[10px] border-[3px] border-card shadow-sm"
                    />
                    <div className="mt-3 rounded-[12px] bg-card/70 px-2 pb-3 pt-2">
                      <p className="font-hand text-[1.2rem] leading-snug text-foreground/80">{profile.story}</p>
                      <IconHeart className="ml-auto mt-1 h-7 w-7 text-accent" stroke={1.7} />
                    </div>
                  </div>

                  <div className="min-w-0 border-l border-primary/20 pl-3">
                    <div className="flex items-start justify-end gap-1.5">
                      <CancellationLines className="mt-2 hidden h-4 w-10 min-[400px]:block" />
                      <Postmark className="h-12 w-12 text-primary/45" />
                      <Stamp className="h-12 w-10" value="W" />
                    </div>

                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                      Thoughtful introduction
                    </p>
                    <h1 className="mt-1 font-serif text-[2rem] font-semibold leading-none text-primary">
                      {profile.name}, <span className="text-[1.55rem] text-primary/75">{profile.age}</span>
                    </h1>
                    <div className="my-2 flex items-center gap-2 text-primary/35">
                      <span className="h-px flex-1 bg-current" />
                      <IconHeart className="h-3.5 w-3.5 fill-current" stroke={1.8} />
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
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border border-primary/25 bg-secondary text-center">
                        <span className="font-serif text-base font-bold leading-none text-primary">{match.compatibility}%</span>
                        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-primary/70">fit</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFullProfile(true)}
                        className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-full border border-gold bg-card/60 px-2 text-[11px] font-bold text-primary hover:bg-secondary"
                      >
                        Full postcard
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-background/92 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
              <div className="px-2 text-center">
                <div className="flex items-center justify-center gap-3 text-accent/60">
                  <span className="h-px w-20 bg-current" />
                  <IconHeart className="h-4 w-4 fill-current" stroke={1.8} />
                  <span className="h-px w-20 bg-current" />
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-foreground/85">{statusCopy}</p>
                <p className="text-sm font-semibold leading-6 text-muted-foreground">{privacyCopy}</p>
              </div>

              <div className="mt-4 grid grid-cols-[0.85fr_1.7fr_0.85fr] gap-3">
                <ActionTile href="/home" label="Keep for later" icon={IconBookmark} />
                <ActionTile href="/match/letter" label={primaryActionLabel} icon={match.status === "connected" ? IconHeartHandshake : IconPencil} primary />
                <ActionTile href="/home" label={match.status === "revealed" ? "Pass" : "Home"} icon={IconX} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={showFullProfile}
        onOpenChange={setShowFullProfile}
        title={`${profile.name}'s postcard`}
        className="max-h-[85vh] overflow-y-auto"
      >
        <ProfileDetail profile={profile} />
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

function MiniPostcard({ profile, className }: { profile: Profile; className?: string }) {
  return (
    <div
      className={`paper-texture flex h-[5.9rem] items-center gap-2.5 rounded-[12px] border border-border bg-card/95 p-2 shadow-postcard ${className ?? ""}`}
      aria-hidden
    >
      <ProfilePhoto
        name={profile.name}
        src={profile.localPhotoUrl ?? profile.photoUrl}
        className="h-full w-[5.6rem] shrink-0 rounded-[7px] border-2 border-card shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-xl font-semibold leading-tight text-primary">
          {profile.name}, {profile.age}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{profile.city}</p>
      </div>
      <CancellationLines className="hidden h-4 w-10 text-primary/30 min-[390px]:block" />
      <Stamp className="h-12 w-10" value="W" />
    </div>
  );
}

function ActionTile({
  href,
  label,
  icon: Icon,
  primary
}: {
  href: string;
  label: string;
  icon: MatchIcon;
  primary?: boolean;
}) {
  const className = primary
    ? "flex min-h-[5.25rem] items-center justify-center gap-3 rounded-[28px] bg-primary px-4 text-primary-foreground shadow-soft"
    : "flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-[24px] border border-border bg-card/85 px-2 text-primary shadow-sm";

  return (
    <Link href={href} className={className}>
      <Icon className={primary ? "h-7 w-7 shrink-0" : "h-6 w-6 shrink-0"} stroke={primary ? 1.9 : 2} />
      <span className={primary ? "font-serif text-2xl font-semibold leading-none" : "text-center text-[0.78rem] font-bold leading-tight"}>
        {label}
      </span>
    </Link>
  );
}
