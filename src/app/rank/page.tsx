"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { IconChevronLeft, IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { RankCard } from "@/components/rank/rank-card";
import { ProfileDetail } from "@/components/wednesday/profile-detail";
import { Postmark } from "@/components/wednesday/stamp";
import { currentRound, getCandidate, rankingComplete, setRoundOrder, submitRound } from "@/lib/demo/demo-actions";
import { useDemoState, useStoreHydrated } from "@/lib/demo/demo-store";
import { REVEAL_DAY, WEEK_DAYS } from "@/types/clock";

export default function RankPage() {
  const state = useDemoState();
  const router = useRouter();
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hydrated = useStoreHydrated();
  React.useEffect(() => {
    if (hydrated && !state.joinedWeek) router.replace("/");
  }, [hydrated, state.joinedWeek, router]);
  if (!state.joinedWeek) return null;

  const round = currentRound(state);
  const done = rankingComplete(state);
  const poolRounds = state.rounds.filter((item) => !item.isFinal);
  const viewingProfile = getCandidate(viewingId);

  if (done || !round) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="paper-texture mt-10 rounded-[20px] border border-border bg-card p-8 text-center shadow-postcard"
        >
          <div className="flex justify-center">
            <Postmark className="h-20 w-20" />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold">Your ranking is sealed</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Nothing left to do but wait for Wednesday {WEEK_DAYS[REVEAL_DAY].date}. Your preferences meet everyone
            else's in a single allocation — stable, mutual, and never below 50% compatibility.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground">
            <IconLock className="h-4 w-4" stroke={2} />
            Sealed until Wednesday — use the demo clock to move time
          </div>
          <Link href="/home" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            Back home
          </Link>
        </motion.div>
      </Shell>
    );
  }

  const items = round.rankedOrder;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !round) return;
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    setRoundOrder(round.round, arrayMove(items, oldIndex, newIndex));
  }

  return (
    <Shell>
      <div className="mb-1 flex gap-1.5">
        {state.rounds.map((item) => (
          <span
            key={item.round}
            className={`h-1.5 flex-1 rounded-full ${item.submitted ? "bg-primary" : item.round === round.round ? "bg-accent" : "bg-muted"}`}
          />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
        {round.isFinal ? "The final five" : `Round ${round.round} of ${poolRounds.length}`}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight">
        {round.isFinal ? "Your round winners. Order them with care." : "Rank these people — most excited first."}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {round.isFinal
          ? "This final order carries the most weight in Wednesday's allocation."
          : "Drag to reorder. Tap a card to read the full profile — it's a person, not a photo."}
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ol className="mt-5 space-y-3">
            {items.map((profileId, index) => {
              const profile = getCandidate(profileId);
              return profile ? (
                <RankCard key={profileId} id={profileId} index={index} profile={profile} onView={() => setViewingId(profileId)} />
              ) : null;
            })}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="sticky bottom-0 -mx-5 mt-6 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Button size="lg" className="w-full" onClick={() => submitRound(round.round)}>
          {round.isFinal ? "Seal my ranking" : `Seal round ${round.round}`}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Sealed rounds can't be reopened — rank like it matters.</p>
      </div>

      <Dialog
        open={Boolean(viewingProfile)}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
        title={viewingProfile ? `${viewingProfile.name}'s postcard` : ""}
        className="max-h-[85vh] overflow-y-auto"
      >
        {viewingProfile ? <ProfileDetail profile={viewingProfile} /> : null}
      </Dialog>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-5 pb-10 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/home" aria-label="Back home" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
          <IconChevronLeft className="h-5 w-5" stroke={2} />
        </Link>
        <span className="text-sm font-bold">This week's pool</span>
        <span className="w-9" />
      </div>
      {children}
    </main>
  );
}
