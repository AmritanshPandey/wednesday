"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCalendarClock, IconPlayerTrackNext, IconRefresh, IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { advanceDay, jumpToWednesday, resetDemo, runAllocationNow } from "@/lib/app/actions";
import { useAppState } from "@/lib/app/store";
import { labelForClock } from "@/lib/week";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const noopSubscribe = () => () => {};

/**
 * True only when actually running on localhost. Checked at runtime against
 * the real hostname rather than a build-time env flag, so the dev panel can
 * never leak onto the deployed app even if an env var is misconfigured.
 */
function useIsLocalhost() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => LOCAL_HOSTS.has(window.location.hostname),
    () => false
  );
}

const PHASE_LABEL: Record<string, string> = {
  ranking: "Ranking window is open",
  sealed: "Ranking sealed — waiting for Wednesday",
  reveal: "Wednesday — introductions revealed",
  deadline: "Thursday — letters due today",
  winddown: "The week is winding down"
};

/**
 * Dev-only time machine. Lets a single machine play the whole Wednesday cycle
 * without waiting for real time, and trigger the allocation on demand.
 * Visible only on localhost — never on the deployed app, for any user.
 */
export function DemoPanel() {
  const state = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const isLocalhost = useIsLocalhost();
  const [open, setOpen] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  if (!isLocalhost || !state.signedIn || pathname === "/match") return null;

  const label = labelForClock(state.clock);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open dev time controls"
        className="fixed bottom-28 right-4 z-40 flex items-center gap-2 rounded-full border border-accent bg-card px-3.5 py-2.5 text-xs font-bold text-accent shadow-postcard transition hover:bg-secondary sm:right-[calc(50%-215px+1rem)] md:right-[calc(50%-280px+1rem)]"
      >
        <IconCalendarClock className="h-4 w-4" stroke={2.2} />
        {label.short} {label.date}
      </button>

      <Dialog open={open} onOpenChange={setOpen} title="Dev time machine" description="Play the Wednesday cycle without waiting for real time.">
        <div className="space-y-5">
          <div className="rounded-[14px] bg-secondary px-4 py-3">
            <p className="text-sm font-bold">
              {label.label}, {label.date}
            </p>
            <p className="mt-0.5 text-xs text-secondary-foreground/80">{PHASE_LABEL[state.clock.phase]}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => advanceDay()}>
              <IconPlayerTrackNext className="h-4 w-4" stroke={2.2} />
              Advance a day
            </Button>
            <Button variant="outline" onClick={() => jumpToWednesday()} disabled={state.clock.phase === "reveal" || state.clock.phase === "deadline"}>
              Jump to Wednesday
            </Button>
          </div>

          <Button
            className="w-full"
            disabled={running}
            onClick={async () => {
              setRunning(true);
              try {
                await runAllocationNow();
              } finally {
                setRunning(false);
              }
            }}
          >
            <IconSparkles className="h-4 w-4" stroke={2.2} />
            {running ? "Running allocation…" : "Run allocation now"}
          </Button>

          <div className="border-t border-dashed border-border pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetDemo();
                setOpen(false);
                router.push("/home");
              }}
            >
              <IconRefresh className="h-4 w-4" stroke={2.2} />
              Reset time to now
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
