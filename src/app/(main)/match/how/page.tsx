"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PipelineDiagram } from "@/components/wednesday/pipeline-diagram";
import { getCandidate } from "@/lib/app/actions";
import { useDemoState, useStoreHydrated } from "@/lib/app/store";

export default function HowThisMatchPage() {
  const state = useDemoState();
  const hydrated = useStoreHydrated();
  const router = useRouter();

  React.useEffect(() => {
    if (hydrated && (!state.stats || !state.match)) router.replace("/match");
  }, [hydrated, state.stats, state.match, router]);
  if (!state.stats || !state.match) return null;

  const stats = state.stats;
  const match = state.match;
  const profile = getCandidate(match.profileId);

  const steps = [
    {
      title: "Filter",
      figure: `${stats.candidatesConsidered} → ${stats.poolSize}`,
      detail: `${stats.candidatesConsidered} profiles were considered. ${stats.passedDealBreakers} cleared the deal-breakers in both directions, and ${stats.poolSize} made your pool after the 50% compatibility floor.`
    },
    {
      title: "Score",
      figure: profile ? `${match.compatibility}%` : undefined,
      detail: profile
        ? `Every surviving pairing got a mutual score. You and ${profile.name} scored ${match.compatibility}% — you ranked ${ordinal(stats.yourRankOfMatch)} among your ${stats.poolSize}.`
        : "Every surviving pairing got a mutual compatibility score."
    },
    {
      title: "Rank",
      figure: `${stats.marketSeekers} seekers`,
      detail:
        "Your submitted ranking was combined with the rest of this week's market. The standard allocation uses those ranked preferences directly."
    },
    {
      title: "Introduce",
      figure: `${stats.blockingPairs} blocking pairs`,
      detail: `Deferred acceptance ran across all ${stats.marketSeekers} seekers this week and settled on a stable outcome: ${
        stats.blockingPairs === 0
          ? "no two people in the market would rather drop their introductions for each other."
          : "the closest available outcome under this week's ranked preferences."
      }`
    }
  ];

  return (
    <div className="px-6 pb-10">
      <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight">How this match was made</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The same four steps run for everyone, every Wednesday. Nothing about attention, streaks, or engagement — only
        fit.
      </p>

      <div className="mt-6 rounded-[18px] border border-border bg-card p-5">
        <PipelineDiagram steps={steps} />
      </div>

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Based on Gale-Shapley deferred acceptance.
      </p>

      <Link href="/match" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        Back to your introduction
      </Link>
    </div>
  );
}

function ordinal(rank: number | null): string {
  if (!rank) return "highly";
  const suffix = rank % 10 === 1 && rank !== 11 ? "st" : rank % 10 === 2 && rank !== 12 ? "nd" : rank % 10 === 3 && rank !== 13 ? "rd" : "th";
  return `${rank}${suffix}`;
}
