import type { Preferences, PreferenceSectionKey } from "@/types/preferences";
import type { Profile } from "@/types/profile";
import type { CategoryScore } from "@/types/ranking";
import type { CompatibilityModel } from "@/lib/matching/interfaces";
import {
  CANNABIS,
  DRINKING,
  FITNESS,
  INTENTS,
  LIVING_AFTER_MARRIAGE,
  SMOKING,
  TAX_BRACKETS,
  TIMELINES
} from "@/lib/profile-options";

const NEUTRAL_ANSWERS = new Set(["Prefer not to say", "Prefer not to share", "No strong preference"]);

function ordinalCloseness(list: readonly string[], a: string, b: string): number {
  if (NEUTRAL_ANSWERS.has(a) || NEUTRAL_ANSWERS.has(b)) return 0.55;
  const ia = list.indexOf(a);
  const ib = list.indexOf(b);
  if (ia < 0 || ib < 0) return 0.5;
  return 1 - Math.abs(ia - ib) / Math.max(list.length - 1, 1);
}

function jaccard(a: string[], b: string[]): number {
  const setB = new Set(b);
  const shared = a.filter((item) => setB.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0.5 : shared / union;
}

function overlapCoefficient(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0.4;
  const setB = new Set(b);
  const shared = a.filter((item) => setB.has(item)).length;
  return shared / Math.min(a.length, b.length);
}

function childrenCloseness(a: string, b: string): number {
  if (a === b) return 1;
  const pair = new Set([a, b]);
  if (pair.has("Prefer to discuss later")) return 0.6;
  if (pair.has("Want children") && pair.has("Open to children")) return 0.8;
  if (pair.has("Open to children") && pair.has("Don't want children")) return 0.35;
  return 0;
}

function livingCloseness(a: string, b: string): number {
  if (a === b) return 1;
  if (a === "Open to discussion" || b === "Open to discussion") return 0.75;
  return ordinalCloseness(LIVING_AFTER_MARRIAGE, a, b);
}

function relocationCloseness(a: string, b: string): number {
  if (a === b) return 1;
  const pair = new Set([a, b]);
  if (pair.has("Open to moving abroad") && pair.has("My city only")) return 0.2;
  if (pair.has("Anywhere in India")) return 0.85;
  return 0.55;
}

function foodCloseness(a: string, b: string): number {
  if (a === b) return 1;
  const pair = new Set([a, b]);
  if (pair.has("No strong preference")) return 0.75;
  if (pair.has("Vegetarian") && pair.has("Vegan")) return 0.8;
  if (pair.has("Vegetarian") && pair.has("Eggetarian")) return 0.7;
  if (pair.has("Eggetarian") && pair.has("Non-vegetarian")) return 0.75;
  if (pair.has("Vegetarian") && pair.has("Non-vegetarian")) return 0.35;
  if (pair.has("Vegan") && pair.has("Non-vegetarian")) return 0.25;
  return 0.6;
}

function sameOrHalf(a: string, b: string): number {
  return a === b ? 1 : 0.45;
}

function cityCloseness(a: Profile, b: Profile): number {
  if (a.city === b.city) return 1;
  const mobile = (p: Profile) => p.relocation === "Anywhere in India" || p.relocation === "Open to moving abroad";
  return mobile(a) || mobile(b) ? 0.6 : 0.35;
}

function religionCloseness(a: string, b: string): number {
  if (a === b) return 1;
  const pair = new Set([a, b]);
  if (pair.has("Spiritual, not religious") || pair.has("Prefer not to say")) return 0.6;
  return 0.3;
}

/**
 * Pairwise compatibility with a per-category breakdown. The similarity
 * measures are symmetric, so score(a, b) === score(b, a) — Gale-Shapley's
 * "good for both sides" principle starts from a mutual number.
 */
export function compatibilityBreakdown(a: Profile, b: Profile): CategoryScore[] {
  return [
    {
      key: "intent",
      label: "Intent & timeline",
      weight: 22,
      score: 0.6 * ordinalCloseness(INTENTS, a.intent, b.intent) + 0.4 * ordinalCloseness(TIMELINES, a.timeline, b.timeline)
    },
    {
      key: "future",
      label: "Family & future plans",
      weight: 20,
      score:
        (childrenCloseness(a.children, b.children) +
          livingCloseness(a.livingAfterMarriage, b.livingAfterMarriage) +
          relocationCloseness(a.relocation, b.relocation)) /
        3
    },
    {
      key: "everyday",
      label: "Everyday lifestyle",
      weight: 18,
      score:
        (ordinalCloseness(DRINKING, a.drinking, b.drinking) +
          ordinalCloseness(SMOKING, a.smoking, b.smoking) +
          ordinalCloseness(CANNABIS, a.cannabis, b.cannabis) +
          foodCloseness(a.food, b.food) +
          ordinalCloseness(FITNESS, a.fitness, b.fitness) +
          jaccard(a.weekend, b.weekend)) /
        6
    },
    {
      key: "values",
      label: "Values & communication",
      weight: 15,
      score:
        0.25 * sameOrHalf(a.communication, b.communication) +
        0.2 * sameOrHalf(a.conflict, b.conflict) +
        0.15 * sameOrHalf(a.partnerSupport, b.partnerSupport) +
        0.4 * jaccard(a.priorities, b.priorities)
    },
    {
      key: "interests",
      label: "Interests",
      weight: 13,
      score: 0.7 * overlapCoefficient(a.interests, b.interests) + 0.3 * jaccard(a.interests, b.interests)
    },
    {
      key: "rooted",
      label: "City, culture & finances",
      weight: 12,
      score:
        (cityCloseness(a, b) +
          religionCloseness(a.religion, b.religion) +
          overlapCoefficient(a.languages, b.languages) +
          ordinalCloseness(TAX_BRACKETS, a.taxBracket, b.taxBracket)) /
        4
    }
  ];
}

export function compatibilityScore(breakdown: CategoryScore[]): number {
  const total = breakdown.reduce((sum, category) => sum + category.score * category.weight, 0);
  return Math.round(Math.max(0, Math.min(100, total)));
}

/**
 * The rule-based CompatibilityModel — today's hand-tuned weights, expressed
 * through the layered seam (extract features → score → clamp). A learned model
 * would implement the same interface and swap in here without allocation ever
 * knowing. Delegates to the functions above, so scores are byte-identical to
 * the pre-seam code (verified in the sim).
 */
export const ruleCompatibilityModel: CompatibilityModel = {
  extractFeatures(a, b) {
    return { categories: compatibilityBreakdown(a, b) };
  },
  scoreFeatures(features) {
    return compatibilityScore(features.categories);
  },
  score(a, b) {
    const breakdown = compatibilityBreakdown(a, b);
    return { compatibility: compatibilityScore(breakdown), breakdown };
  }
};

const NEUTRAL_PREFS = new Set(["No preference", "Fine either way", "Whenever it feels right"]);

/** Whether `candidate` satisfies one preference section of `prefs` (owned by `owner`). */
export function satisfiesPreference(
  section: PreferenceSectionKey,
  prefs: Preferences,
  owner: Profile,
  candidate: Profile
): boolean {
  switch (section) {
    case "age":
      return candidate.age >= prefs.ageMin && candidate.age <= prefs.ageMax;
    case "city":
      if (NEUTRAL_PREFS.has(prefs.cityPref) || prefs.cityPref === "Anywhere in India") return true;
      if (prefs.cityPref === "My city only") return candidate.city === owner.city;
      return (
        candidate.city === owner.city ||
        candidate.relocation === "Anywhere in India" ||
        candidate.relocation === "Open to moving abroad" ||
        candidate.relocation === "Within my region"
      );
    case "religion":
      return NEUTRAL_PREFS.has(prefs.religionPref) ? true : candidate.religion === owner.religion;
    case "timeline":
      if (NEUTRAL_PREFS.has(prefs.timelinePref)) return true;
      if (prefs.timelinePref === "Within a year") return candidate.timeline === "Within a year";
      if (prefs.timelinePref === "Within 2 years")
        return candidate.timeline === "Within a year" || candidate.timeline === "1–2 years";
      return true;
    case "children":
      if (NEUTRAL_PREFS.has(prefs.childrenPref)) return true;
      if (prefs.childrenPref === "Wants or is open to children")
        return candidate.children === "Want children" || candidate.children === "Open to children";
      return candidate.children === "Don't want children";
    case "relocation":
      if (NEUTRAL_PREFS.has(prefs.relocationPref)) return true;
      if (prefs.relocationPref === "Open to relocating")
        return (
          candidate.relocation === "Anywhere in India" ||
          candidate.relocation === "Open to moving abroad" ||
          candidate.relocation === "Within my region"
        );
      return candidate.relocation === "My city only" || candidate.relocation === "Within my region";
    case "finance":
      if (NEUTRAL_PREFS.has(prefs.financePref)) return true;
      if (prefs.financePref === "Financially independent")
        return candidate.financialIndependence === "Financially independent";
      return candidate.lifestyleExpectation === owner.lifestyleExpectation;
    case "smoking":
      return NEUTRAL_PREFS.has(prefs.smokingPref) ? true : candidate.smoking === "No";
    case "cannabis":
      return NEUTRAL_PREFS.has(prefs.cannabisPref) ? true : candidate.cannabis === "No";
    case "drinking":
      if (NEUTRAL_PREFS.has(prefs.drinkingPref)) return true;
      if (prefs.drinkingPref === "Prefer rarely or never")
        return candidate.drinking === "No" || candidate.drinking === "Occasionally";
      return candidate.drinking === "No";
    case "food":
      if (NEUTRAL_PREFS.has(prefs.foodPref)) return true;
      if (prefs.foodPref === "Prefer vegetarian")
        return candidate.food === "Vegetarian" || candidate.food === "Vegan";
      return candidate.food === "Vegetarian";
    default:
      return true;
  }
}

/** Hard filter: every section toggled as a deal-breaker must be satisfied. */
export function passesDealBreakers(prefs: Preferences, owner: Profile, candidate: Profile): boolean {
  return (Object.keys(prefs.dealBreakers) as PreferenceSectionKey[]).every(
    (section) => !prefs.dealBreakers[section] || satisfiesPreference(section, prefs, owner, candidate)
  );
}

/** Soft preferences (not deal-breakers) nudge the score a little either way. */
export function softPreferenceAdjustment(prefs: Preferences, owner: Profile, candidate: Profile): number {
  const sections: PreferenceSectionKey[] = [
    "city",
    "religion",
    "timeline",
    "children",
    "relocation",
    "finance",
    "smoking",
    "drinking",
    "cannabis",
    "food"
  ];
  let adjustment = 0;
  for (const section of sections) {
    if (prefs.dealBreakers[section]) continue;
    adjustment += satisfiesPreference(section, prefs, owner, candidate) ? 1 : -2;
  }
  return adjustment;
}

/** Human-readable "why you fit" lines for the reveal screen. */
export function buildReasons(user: Profile, candidate: Profile): string[] {
  const reasons: string[] = [];
  if (user.intent === candidate.intent) {
    reasons.push(`You are both here for: ${user.intent.toLowerCase()}`);
  } else {
    reasons.push("You want similar things from a relationship");
  }
  if (user.timeline === candidate.timeline) reasons.push(`Same marriage timeline — ${user.timeline.toLowerCase()}`);
  if (childrenCloseness(user.children, candidate.children) >= 0.8) reasons.push("Aligned on children");
  if (user.city === candidate.city) reasons.push(`You are both in ${user.city}`);
  const sharedInterests = user.interests.filter((interest) => candidate.interests.includes(interest));
  if (sharedInterests.length >= 2) reasons.push(`You both enjoy ${sharedInterests.slice(0, 3).join(", ").toLowerCase()}`);
  if (user.communication === candidate.communication)
    reasons.push(`You handle communication the same way — ${user.communication.toLowerCase()}`);
  if (user.food === candidate.food) reasons.push(`Same food lifestyle — ${user.food.toLowerCase()}`);
  const sharedPriorities = user.priorities.filter((priority) => candidate.priorities.includes(priority));
  if (sharedPriorities.length >= 1) reasons.push(`Shared priority: ${sharedPriorities[0].toLowerCase()}`);
  return reasons.slice(0, 5);
}
