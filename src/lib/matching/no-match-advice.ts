import type { Preferences } from "@/types/preferences";

export type NoMatchAdvice = {
  /** One-line reason, honest about what happened. */
  headline: string;
  /** Concrete, actionable next step — always about a SOFT lever, never asking
   *  someone to abandon a genuine deal-breaker. */
  suggestion: string;
  /** The preference section most responsible, if identifiable. */
  bindingSection: string | null;
};

type Stats = { candidatesConsidered: number; passedDealBreakers: number; poolSize: number };

/**
 * Explains a no-match from data already stored on the pool, so the reveal
 * screen can turn a silent "no match" into an actionable choice. The gap
 * between candidatesConsidered and passedDealBreakers is exactly how much the
 * user's own hard filters shrank their market.
 */
export function computeNoMatchAdvice(prefs: Preferences, stats: Stats): NoMatchAdvice {
  const { candidatesConsidered, passedDealBreakers, poolSize } = stats;

  // Had a real pool, still no match: the market cleared around them this week.
  if (poolSize > 0) {
    return {
      headline: "You had a strong pool this week, but everyone in it was introduced to someone else.",
      suggestion: "Rank a few more people next week — the further down your list we can look, the more likely a match.",
      bindingSection: null
    };
  }

  // Deal-breakers did most of the cutting.
  const removedByDealBreakers = candidatesConsidered - passedDealBreakers;
  if (candidatesConsidered > 0 && removedByDealBreakers / candidatesConsidered >= 0.7) {
    const active = (Object.keys(prefs.dealBreakers) as (keyof typeof prefs.dealBreakers)[]).filter(
      (k) => prefs.dealBreakers[k]
    );
    const pct = Math.round((removedByDealBreakers / candidatesConsidered) * 100);
    // Name the likeliest culprit among common narrow filters.
    const culprit = active.includes("religion")
      ? "religion"
      : active.includes("city")
        ? "city"
        : active.includes("age")
          ? "age"
          : active[0] ?? null;
    const label: Record<string, string> = {
      religion: "Your same-faith requirement",
      city: "Your city-only requirement",
      age: "Your age range",
      smoking: "Your non-smoker requirement",
      food: "Your dietary requirement",
      drinking: "Your drinking requirement",
      cannabis: "Your cannabis requirement"
    };
    return {
      headline: `Your must-haves removed about ${pct}% of this week's members before matching even began.`,
      suggestion: culprit
        ? `${label[culprit] ?? "One of your deal-breakers"} is doing most of the narrowing. If it's a preference rather than a true must-have, softening it would open your pool.`
        : "If any of your deal-breakers are preferences rather than true must-haves, softening one would open your pool.",
      bindingSection: culprit
    };
  }

  // Thin market overall.
  return {
    headline: "There weren't enough compatible members in your area this week.",
    suggestion: "We're still growing your city. Staying active means you're first in line as more people join.",
    bindingSection: null
  };
}
