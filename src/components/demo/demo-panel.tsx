"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCalendarClock, IconPlayerTrackNext, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { advanceDay, jumpToWednesday, rankingComplete, resetDemo } from "@/lib/demo/demo-actions";
import { useDemoState } from "@/lib/demo/demo-store";
import { DEADLINE_DAY, REVEAL_DAY, WEEK_DAYS } from "@/types/clock";

function phaseLabel(dayIndex: number, ranked: boolean, hasMatch: boolean): string {
  if (dayIndex < REVEAL_DAY) return ranked ? "Ranking sealed — waiting for Wednesday" : "Ranking window open";
  if (dayIndex === REVEAL_DAY) return hasMatch ? "Introduction revealed" : "Wednesday — finish ranking to be included";
  if (dayIndex === DEADLINE_DAY) return "Deadline day — letters must be posted today";
  return "The week is winding down";
}

/**
 * The simulated-week control. This is demo scaffolding, not product UI —
 * it lets you play the whole Wednesday cycle in a minute.
 */
export function DemoPanel() {
  const state = useDemoState();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  if (!state.joinedWeek || pathname === "/match") return null;

  const day = WEEK_DAYS[state.dayIndex];
  const ranked = rankingComplete(state);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open demo time controls"
        className="fixed bottom-28 right-4 z-40 flex items-center gap-2 rounded-full border border-accent bg-card px-3.5 py-2.5 text-xs font-bold text-accent shadow-postcard transition hover:bg-secondary sm:right-[calc(50%-215px+1rem)]"
      >
        <IconCalendarClock className="h-4 w-4" stroke={2.2} />
        {day.short} {day.date}
      </button>

      <Dialog open={open} onOpenChange={setOpen} title="Simulated week" description="Demo controls — play the Wednesday cycle at your own pace.">
        <div className="space-y-5">
          <div className="rounded-[14px] bg-secondary px-4 py-3">
            <p className="text-sm font-bold">
              Today is {day.label}, {day.date}
            </p>
            <p className="mt-0.5 text-xs text-secondary-foreground/80">{phaseLabel(state.dayIndex, ranked, Boolean(state.match))}</p>
          </div>

          <div className="flex flex-wrap gap-1.5" aria-hidden>
            {WEEK_DAYS.map((weekDay, index) => (
              <span
                key={`${weekDay.short}-${weekDay.date}`}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  index === state.dayIndex
                    ? "bg-primary text-primary-foreground"
                    : index < state.dayIndex
                      ? "bg-muted text-muted-foreground line-through"
                      : "bg-card text-muted-foreground border border-border"
                }`}
              >
                {weekDay.short} {index === REVEAL_DAY ? "★" : ""}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => advanceDay()} disabled={state.dayIndex >= WEEK_DAYS.length - 1}>
              <IconPlayerTrackNext className="h-4 w-4" stroke={2.2} />
              Advance a day
            </Button>
            <Button variant="outline" onClick={() => jumpToWednesday()} disabled={state.dayIndex >= REVEAL_DAY}>
              Jump to Wednesday
            </Button>
          </div>

          <div className="border-t border-dashed border-border pt-4">
            <Button
              variant="outline"
              className="w-full text-destructive"
              onClick={() => {
                resetDemo();
                setOpen(false);
                router.push("/");
              }}
            >
              <IconRefresh className="h-4 w-4" stroke={2.2} />
              Reset the whole demo
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
