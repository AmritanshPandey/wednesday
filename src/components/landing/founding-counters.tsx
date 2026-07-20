"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type FoundingStats = {
  male: number;
  female: number;
  maleCap: number;
  femaleCap: number;
  total: number;
  totalCap: number;
  activeUsers: number;
  launched: boolean;
};

const POLL_MS = 45_000;

/** Live founding-cohort numbers, polled gently. Null until the first load. */
export function useFoundingStats(): FoundingStats | null {
  const [stats, setStats] = React.useState<FoundingStats | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = (await res.json()) as FoundingStats;
        if (alive) setStats(data);
      } catch {
        // Offline or cold start — counters simply hold their last value.
      }
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return stats;
}

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

/** One side of the print run: a letterpress edition card. */
function EditionCard({
  label,
  taken,
  cap,
  accent
}: {
  label: string;
  taken: number;
  cap: number;
  accent?: boolean;
}) {
  const left = Math.max(0, cap - taken);
  const pct = cap === 0 ? 0 : Math.min(100, (taken / cap) * 100);
  return (
    <div className="paper-texture relative overflow-hidden rounded-[18px] border border-border p-6 shadow-postcard">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="letterpress mt-3 font-serif text-[2.75rem] leading-none text-primary">
        {pad(taken)}
        <span className="text-[1.35rem] text-primary/50"> / {cap}</span>
      </p>
      <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000", accent ? "bg-accent" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">
        {left === 0 ? "This side of the edition is full" : `${left} place${left === 1 ? "" : "s"} remain`}
      </p>
    </div>
  );
}

/** The Founding Thousand, told as a numbered print run — two sides, kept in
 *  balance because a fair market needs both present. */
export function FoundingCounters({ stats }: { stats: FoundingStats | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <EditionCard label="Gentlemen" taken={stats?.male ?? 0} cap={stats?.maleCap ?? 500} />
      <EditionCard label="Ladies" taken={stats?.female ?? 0} cap={stats?.femaleCap ?? 500} accent />
    </div>
  );
}
