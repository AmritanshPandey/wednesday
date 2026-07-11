"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";
import { getDb, getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { computeWeekClock, type WeekClock } from "@/lib/week";
import { blankPreferences, blankProfile } from "@/lib/app/defaults";
import { threadIdFor, type LetterDoc, type MatchDoc, type PoolDoc, type RankingDoc, type UserDoc } from "@/lib/app/types";
import type { MatchResult, AllocationStats } from "@/types/match";
import type { Letter } from "@/types/letter";
import type { PoolEntry, RankingRound } from "@/types/ranking";
import type { Preferences } from "@/types/preferences";
import type { Profile } from "@/types/profile";

const DEV_OFFSET_KEY = "wednesday-dev-offset-ms";

export type AppState = {
  configured: boolean;
  authReady: boolean;
  signedIn: boolean;
  uid: string | null;
  authName: string | null;
  authPhoto: string | null;

  profile: Profile;
  preferences: Preferences;
  setupComplete: boolean;
  setupStepReached: number;
  joinedWeek: boolean;

  pool: PoolEntry[];
  candidatesConsidered: number;
  passedDealBreakers: number;
  rounds: RankingRound[];
  match: MatchResult | null;
  matchProfile: Profile | null;
  stats: AllocationStats | null;
  letters: Letter[];

  clock: WeekClock;
  dayIndex: number;
};

function initialState(): AppState {
  return {
    configured: isFirebaseConfigured,
    authReady: false,
    signedIn: false,
    uid: null,
    authName: null,
    authPhoto: null,
    profile: blankProfile(),
    preferences: blankPreferences(),
    setupComplete: false,
    setupStepReached: 1,
    joinedWeek: false,
    pool: [],
    candidatesConsidered: 0,
    passedDealBreakers: 0,
    rounds: [],
    match: null,
    matchProfile: null,
    stats: null,
    letters: [],
    clock: computeWeekClock(),
    dayIndex: computeWeekClock().dayIndex
  };
}

let state: AppState = initialState();
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

// ── Dev time override ──────────────────────────────────────────────────────
function readDevOffset(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DEV_OFFSET_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export function nowWithOffset(): number {
  return Date.now() + readDevOffset();
}

export function setDevOffset(ms: number) {
  if (typeof window !== "undefined") window.localStorage.setItem(DEV_OFFSET_KEY, String(ms));
  refreshClock();
}

export function getDevOffset(): number {
  return readDevOffset();
}

function refreshClock() {
  const clock = computeWeekClock(nowWithOffset());
  state = { ...state, clock, dayIndex: clock.dayIndex };
  // Re-subscribe to the (possibly new) week's docs.
  subscribeWeek(state.uid, clock.weekId);
  listeners.forEach((l) => l());
}

// ── Firestore subscriptions ────────────────────────────────────────────────
let userUnsub: Unsubscribe | null = null;
let weekUnsubs: Unsubscribe[] = [];
let currentWeekId: string | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

function clearWeekSubs() {
  weekUnsubs.forEach((u) => u());
  weekUnsubs = [];
  currentWeekId = null;
}

function poolFromDoc(d: PoolDoc | undefined): Pick<AppState, "pool" | "candidatesConsidered" | "passedDealBreakers"> {
  return {
    pool: d?.entries ?? [],
    candidatesConsidered: d?.candidatesConsidered ?? 0,
    passedDealBreakers: d?.passedDealBreakers ?? 0
  };
}

function matchFromDoc(d: MatchDoc | undefined): { match: MatchResult | null; stats: AllocationStats | null } {
  if (!d) return { match: null, stats: null };
  return {
    match: {
      profileId: d.matchUid,
      compatibility: d.compatibility,
      breakdown: d.breakdown ?? [],
      reasons: d.reasons ?? [],
      status: d.status
    },
    stats: (d as MatchDoc & { stats?: AllocationStats }).stats ?? null
  };
}

function subscribeWeek(uid: string | null, weekId: string) {
  if (!uid || !isFirebaseConfigured) return;
  if (currentWeekId === weekId && weekUnsubs.length) return;
  clearWeekSubs();
  currentWeekId = weekId;
  const db = getDb();

  weekUnsubs.push(
    onSnapshot(doc(db, "weeks", weekId, "pools", uid), (snap) => {
      Object.assign(state, poolFromDoc(snap.data() as PoolDoc | undefined));
      emit();
    })
  );
  weekUnsubs.push(
    onSnapshot(doc(db, "weeks", weekId, "rankings", uid), (snap) => {
      const d = snap.data() as RankingDoc | undefined;
      state.rounds = d?.rounds ?? [];
      emit();
    })
  );
  weekUnsubs.push(
    onSnapshot(doc(db, "weeks", weekId, "matches", uid), (snap) => {
      const d = snap.data() as MatchDoc | undefined;
      const { match, stats } = matchFromDoc(d);
      state.match = match;
      state.stats = stats;
      state.matchProfile = d?.profile ?? null;
      subscribeLetters(uid, weekId, d ?? null);
      emit();
    })
  );
}

let lettersUnsub: Unsubscribe | null = null;
function subscribeLetters(uid: string, weekId: string, match: MatchDoc | null) {
  lettersUnsub?.();
  lettersUnsub = null;
  if (!match?.matchUid) {
    state.letters = [];
    return;
  }
  const threadId = match.threadId ?? threadIdFor(weekId, uid, match.matchUid);
  const db = getDb();
  lettersUnsub = onSnapshot(
    query(collection(db, "threads", threadId, "letters"), orderBy("createdAt", "asc")),
    (snap) => {
      state.letters = snap.docs.map((docSnap) => {
        const l = docSnap.data() as LetterDoc;
        return {
          id: docSnap.id,
          author: l.authorUid === uid ? "user" : "match",
          body: l.body,
          dayIndex: state.dayIndex
        } satisfies Letter;
      });
      emit();
    }
  );
}

function subscribeUser(uid: string) {
  userUnsub?.();
  const db = getDb();
  userUnsub = onSnapshot(doc(db, "users", uid), (snap) => {
    const d = snap.data() as UserDoc | undefined;
    if (d) {
      state.profile = { ...blankProfile(), ...d.profile, id: uid };
      state.preferences = { ...blankPreferences(), ...d.preferences };
      state.setupComplete = Boolean(d.setupComplete);
      state.setupStepReached = d.setupStepReached ?? 1;
      state.joinedWeek = d.joinedWeekId === state.clock.weekId;
    }
    emit();
  });
}

export function startLiveSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  if (!isFirebaseConfigured) {
    state = { ...state, configured: false, authReady: true };
    listeners.forEach((l) => l());
    return;
  }

  // Keep the clock fresh (and re-subscribe on week rollover) every minute.
  refreshClock();
  clockTimer = setInterval(refreshClock, 60_000);

  onAuthStateChanged(getFirebaseAuth(), (user: User | null) => {
    state.authReady = true;
    state.signedIn = Boolean(user);
    state.uid = user?.uid ?? null;
    state.authName = user?.displayName ?? null;
    state.authPhoto = user?.photoURL ?? null;

    userUnsub?.();
    clearWeekSubs();
    lettersUnsub?.();

    if (user) {
      state.profile = { ...blankProfile(), id: user.uid, name: user.displayName ?? "" };
      subscribeUser(user.uid);
      subscribeWeek(user.uid, state.clock.weekId);
    } else {
      state = { ...initialState(), configured: true, authReady: true, clock: state.clock, dayIndex: state.dayIndex };
    }
    emit();
  });
}

export function stopLiveSync() {
  userUnsub?.();
  lettersUnsub?.();
  clearWeekSubs();
  if (clockTimer) clearInterval(clockTimer);
  started = false;
}

// ── Auth actions ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  await signInWithPopup(getFirebaseAuth(), googleProvider);
}

export async function signOutUser() {
  await signOut(getFirebaseAuth());
}

// ── React binding ──────────────────────────────────────────────────────────
export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}

/** For the store's own actions to read the latest snapshot. */
export function getAppState(): AppState {
  return state;
}

// ── Back-compat aliases so existing screens keep their call sites ───────────
export const useDemoState = useAppState;

/** True once auth has resolved — guards can safely act on it. */
export function useStoreHydrated(): boolean {
  return useAppState().authReady;
}
