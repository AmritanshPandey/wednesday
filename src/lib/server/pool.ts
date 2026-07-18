import "server-only";

import {
  buildReasons,
  compatibilityBreakdown,
  compatibilityScore,
  passesDealBreakers,
  softPreferenceAdjustment
} from "@/lib/matching/compatibility";
import { MIN_COMPATIBILITY, POOL_TARGET } from "@/lib/matching/market";
import { toPublicProfile, type UserDoc } from "@/lib/app/types";
import type { PoolEntry } from "@/types/ranking";

/** For MVP we introduce across the Male↔Female line only (orientation-aware
 *  matching comes later). Returns true when the two users are on opposite
 *  sides of that line. */
export function oppositeSide(a: UserDoc, b: UserDoc): boolean {
  const g1 = a.profile.gender;
  const g2 = b.profile.gender;
  if (g1 !== "Male" && g1 !== "Female") return false;
  if (g2 !== "Male" && g2 !== "Female") return false;
  return g1 !== g2;
}

/**
 * How far past the shown pool the allocator may reach when every one of the
 * user's 25 is introduced elsewhere. A peripheral profile — rare answers, so
 * compatible with few — ranks its 25 favourites, all of whom are in demand and
 * hold better offers, and would otherwise exhaust the list and match nobody,
 * every week, forever. These ids are never shown or ranked; they only stop a
 * quiet week from being structural. Past ~100 the gain flattens.
 */
export const ALLOCATION_DEPTH = 100;

export type BuiltPool = {
  entries: PoolEntry[];
  /** Ids ranked just below `entries` — allocator-only, see ALLOCATION_DEPTH. */
  allocationTail: string[];
  candidatesConsidered: number;
  passedDealBreakers: number;
};

/**
 * Weekly pipeline steps 1–2 for one real user against the week's other real
 * users: filter on both sides' deal-breakers, score mutually, drop below the
 * 50% floor, keep the top 25 with a denormalized public postcard each, plus a
 * lightweight tail of ids for the allocator to fall back on.
 */
export function buildPoolFor(me: UserDoc, others: UserDoc[]): BuiltPool {
  const candidates = others.filter((other) => other.uid !== me.uid && oppositeSide(me, other));

  const mutual = candidates.filter(
    (other) =>
      passesDealBreakers(me.preferences, me.profile, other.profile) &&
      passesDealBreakers(other.preferences, other.profile, me.profile)
  );

  // Score everyone eligible, then cut: postcards are only worth denormalizing
  // for the 25 the user actually sees.
  const scored = mutual
    .map((other) => {
      const breakdown = compatibilityBreakdown(me.profile, other.profile);
      const compatibility = Math.max(
        0,
        Math.min(97, compatibilityScore(breakdown) + softPreferenceAdjustment(me.preferences, me.profile, other.profile))
      );
      return { other, breakdown, compatibility };
    })
    .filter((s) => s.compatibility >= MIN_COMPATIBILITY)
    .sort((a, b) => b.compatibility - a.compatibility);

  const entries = scored.slice(0, POOL_TARGET).map(
    ({ other, breakdown, compatibility }) =>
      ({
        profileId: other.uid,
        compatibility,
        breakdown,
        profile: { ...toPublicProfile(other.profile), id: other.uid }
      }) satisfies PoolEntry
  );

  const allocationTail = scored.slice(POOL_TARGET, ALLOCATION_DEPTH).map((s) => s.other.uid);

  return { entries, allocationTail, candidatesConsidered: candidates.length, passedDealBreakers: mutual.length };
}

/** Human "why you fit" lines between two real profiles. */
export function reasonsFor(me: UserDoc, other: UserDoc): string[] {
  return buildReasons(me.profile, other.profile);
}
