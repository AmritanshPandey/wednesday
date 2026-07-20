"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";
import { getDb, getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { computeWeekClock, type WeekClock } from "@/lib/week";
import { blankPreferences, blankProfile } from "@/lib/app/defaults";
import { threadIdFor, type ActiveChat, type LetterDoc, type MatchDoc, type MessageDoc, type PoolDoc, type RankingDoc, type UserDoc } from "@/lib/app/types";
import type { MatchResult, AllocationStats } from "@/types/match";
import type { Letter } from "@/types/letter";
import type { ChatMessage } from "@/types/message";
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
  /** Founding-cohort state: undefined until they register interest. */
  foundingSpot: "claimed" | "waitlisted" | null;
  foundingNumber: number | null;

  pool: PoolEntry[];
  candidatesConsidered: number;
  passedDealBreakers: number;
  rounds: RankingRound[];
  match: MatchResult | null;
  matchProfile: Profile | null;
  stats: AllocationStats | null;
  letters: Letter[];
  /** The live/most-recent 7-day chat, independent of the weekly match cycle. */
  chat: ActiveChat | null;
  messages: ChatMessage[];

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
    foundingSpot: null,
    foundingNumber: null,
    pool: [],
    candidatesConsidered: 0,
    passedDealBreakers: 0,
    rounds: [],
    match: null,
    matchProfile: null,
    stats: null,
    letters: [],
    chat: null,
    messages: [],
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

// ── Local edits awaiting confirmation ──────────────────────────────────────
// Setup fields are edited far faster than Firestore round-trips: writes are
// debounced, so a snapshot echoing an older write can land after the user has
// typed more. These overlays hold the edits the server hasn't confirmed yet
// and are re-applied on top of every incoming snapshot, so an in-flight write
// can never roll the field back under the typist.
let localProfileEdits: Partial<Profile> = {};
let localPrefEdits: Partial<Preferences> = {};

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Once the server echoes an edit back, stop overlaying it so that genuine
 *  remote changes (another device, a server job) can flow through again. */
function dropConfirmedEdits(serverProfile?: Partial<Profile>, serverPrefs?: Partial<Preferences>) {
  for (const key of Object.keys(localProfileEdits) as (keyof Profile)[]) {
    if (sameValue(serverProfile?.[key], localProfileEdits[key])) delete localProfileEdits[key];
  }
  for (const key of Object.keys(localPrefEdits) as (keyof Preferences)[]) {
    if (sameValue(serverPrefs?.[key], localPrefEdits[key])) delete localPrefEdits[key];
  }
}

function clearLocalEdits() {
  localProfileEdits = {};
  localPrefEdits = {};
}

/** Apply a profile edit locally and re-render now; Firestore catches up after. */
export function applyProfileEdit(patch: Partial<Profile>) {
  Object.assign(localProfileEdits, patch);
  state.profile = { ...state.profile, ...patch };
  emit();
}

/** Apply a preferences edit locally and re-render now. */
export function applyPreferenceEdit(patch: Partial<Preferences>) {
  Object.assign(localPrefEdits, patch);
  state.preferences = { ...state.preferences, ...patch };
  emit();
}

/** Apply a top-level state change (rounds, setup progress) and re-render now. */
export function applyStateEdit(patch: Partial<AppState>) {
  state = { ...state, ...patch };
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
      status: d.status,
      connectedAt: d.connectedAt ?? null
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

let messagesUnsub: Unsubscribe | null = null;
let messagesThreadId: string | null = null;
/** Live chat stream, driven by the user's activeChat pointer (NOT the weekly
 *  match), so the 7-day window stays streaming after the next Wednesday's
 *  match arrives. Read-only history still streams after the window closes. */
function subscribeMessages(uid: string, chat: ActiveChat | null) {
  if (!chat) {
    messagesUnsub?.();
    messagesUnsub = null;
    messagesThreadId = null;
    state.messages = [];
    return;
  }
  if (chat.threadId === messagesThreadId) return; // already streaming this thread
  messagesUnsub?.();
  messagesThreadId = chat.threadId;
  const db = getDb();
  messagesUnsub = onSnapshot(
    query(collection(db, "threads", chat.threadId, "messages"), orderBy("createdAt", "asc")),
    (snap) => {
      state.messages = snap.docs.map((docSnap) => {
        const m = docSnap.data() as MessageDoc;
        return {
          id: docSnap.id,
          author: m.authorUid === uid ? "user" : "match",
          body: m.body,
          createdAt: m.createdAt
        } satisfies ChatMessage;
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
      dropConfirmedEdits(d.profile, d.preferences);
      // Unconfirmed local edits win over the snapshot — see localProfileEdits.
      state.profile = { ...blankProfile(), ...d.profile, ...localProfileEdits, id: uid };
      state.preferences = { ...blankPreferences(), ...d.preferences, ...localPrefEdits };
      state.setupComplete = Boolean(d.setupComplete);
      state.setupStepReached = Math.max(d.setupStepReached ?? 1, state.setupStepReached);
      state.joinedWeek = d.joinedWeekId === state.clock.weekId;
      state.foundingSpot = d.foundingSpot ?? null;
      state.foundingNumber = d.foundingNumber ?? null;
      state.chat = d.activeChat ?? null;
      subscribeMessages(uid, state.chat);
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
    messagesUnsub?.();
    messagesThreadId = null;
    // Edits belong to whoever was signed in; never carry them across accounts.
    clearLocalEdits();

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
  messagesUnsub?.();
  messagesThreadId = null;
  clearWeekSubs();
  if (clockTimer) clearInterval(clockTimer);
  started = false;
}

// ── Auth actions ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  await signInWithPopup(getFirebaseAuth(), googleProvider);
}

/** Dev-only email/password sign-in for testing against the emulator with
 *  seeded fake accounts. Not used by the real Google-only sign-in flow. */
export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
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
