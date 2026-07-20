"use client";

import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import {
  applyPreferenceEdit,
  applyProfileEdit,
  applyStateEdit,
  getAppState,
  getDevOffset,
  nowWithOffset,
  setDevOffset,
  type AppState
} from "@/lib/app/store";
import {
  buildRankedIds as buildRankedIdsPure,
  currentRound as currentRoundPure,
  rankingComplete as rankingCompletePure,
  withRoundSubmitted
} from "@/lib/app/ranking-logic";
import { computeWeekClock } from "@/lib/week";
import type { Preferences, PreferenceSectionKey } from "@/types/preferences";
import type { Profile } from "@/types/profile";
import type { RankingRound } from "@/types/ranking";

// ── Lookups the pages already expect ───────────────────────────────────────

/** Candidates are real users now; their postcard is denormalized into the
 *  pool entries and the match doc, so look them up from live state. */
export function getCandidate(profileId: string | null | undefined): Profile | undefined {
  if (!profileId) return undefined;
  const state = getAppState();
  const inPool = state.pool.find((entry) => entry.profileId === profileId)?.profile;
  if (inPool) return inPool;
  if (state.match?.profileId === profileId && state.matchProfile) return state.matchProfile;
  return undefined;
}

export function rankingComplete(state: Pick<AppState, "rounds">): boolean {
  return rankingCompletePure(state.rounds);
}

export function currentRound(state: Pick<AppState, "rounds">): RankingRound | undefined {
  return currentRoundPure(state.rounds);
}

// ── Firestore write helpers ─────────────────────────────────────────────────

function requireUid(): string | null {
  return getAppState().uid;
}

async function idToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}

function userRef(uid: string) {
  return doc(getDb(), "users", uid);
}

let profileTimer: ReturnType<typeof setTimeout> | null = null;
let pendingProfile: Partial<Profile> = {};
let pendingPrefs: Partial<Preferences> = {};

/** Optimistically merge into local state, then debounce-write to Firestore so
 *  keystroke-heavy setup fields don't fire a write per character. */
function scheduleUserWrite() {
  if (profileTimer) clearTimeout(profileTimer);
  profileTimer = setTimeout(async () => {
    const uid = requireUid();
    if (!uid) return;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(pendingProfile)) patch[`profile.${k}`] = v;
    for (const [k, v] of Object.entries(pendingPrefs)) patch[`preferences.${k}`] = v;
    pendingProfile = {};
    pendingPrefs = {};
    try {
      await updateDoc(userRef(uid), patch);
    } catch {
      // Doc may not exist yet on very first edit — create it.
      await ensureUserDoc();
      await updateDoc(userRef(uid), patch);
    }
  }, 350);
}

async function ensureUserDoc() {
  const uid = requireUid();
  if (!uid) return;
  const state = getAppState();
  await setDoc(
    userRef(uid),
    {
      uid,
      email: getFirebaseAuth().currentUser?.email ?? null,
      displayName: state.authName,
      photoURL: state.authPhoto,
      profile: state.profile,
      preferences: state.preferences,
      setupComplete: false,
      setupStepReached: state.setupStepReached,
      joinedWeekId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

export function updateProfile(patch: Partial<Profile>) {
  applyProfileEdit(patch);
  pendingProfile = { ...pendingProfile, ...patch };
  scheduleUserWrite();
}

export function updatePreferences(patch: Partial<Preferences>) {
  applyPreferenceEdit(patch);
  pendingPrefs = { ...pendingPrefs, ...patch };
  scheduleUserWrite();
}

export function toggleDealBreaker(section: PreferenceSectionKey) {
  const prefs = getAppState().preferences;
  const dealBreakers = { ...prefs.dealBreakers, [section]: !prefs.dealBreakers[section] };
  applyPreferenceEdit({ dealBreakers });
  pendingPrefs = { ...pendingPrefs, dealBreakers };
  scheduleUserWrite();
}

export function reachSetupStep(step: number) {
  const uid = requireUid();
  const next = Math.max(getAppState().setupStepReached, step);
  applyStateEdit({ setupStepReached: next });
  if (uid) void updateDoc(userRef(uid), { setupStepReached: next }).catch(() => ensureUserDoc());
}

/** Verify + join this week: persist the profile, mark joined, ask the server
 *  to build this user's pool from everyone else who has joined. */
export async function completeSetupAndJoin(): Promise<void> {
  const uid = requireUid();
  if (!uid) return;
  const state = getAppState();
  const weekId = state.clock.weekId;
  await ensureUserDoc();
  await updateDoc(userRef(uid), {
    profile: state.profile,
    preferences: state.preferences,
    setupComplete: true,
    joinedWeekId: weekId,
    updatedAt: Date.now()
  });
  const token = await idToken();
  await fetch("/api/join", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ weekId })
  });
}

// ── Ranking ──────────────────────────────────────────────────────────────────

function rankingRef(weekId: string, uid: string) {
  return doc(getDb(), "weeks", weekId, "rankings", uid);
}

export function setRoundOrder(roundNumber: number, order: string[]) {
  const state = getAppState();
  const uid = state.uid;
  if (!uid) return;
  const rounds = state.rounds.map((r) => (r.round === roundNumber && !r.submitted ? { ...r, rankedOrder: order } : r));
  applyStateEdit({ rounds });
  void setDoc(rankingRef(state.clock.weekId, uid), { uid, weekId: state.clock.weekId, rounds, updatedAt: Date.now() }, { merge: true });
}

export function submitRound(roundNumber: number) {
  const state = getAppState();
  const uid = state.uid;
  if (!uid) return;
  const rounds = withRoundSubmitted(state.rounds, roundNumber);
  const submitted = rankingCompletePure(rounds);
  applyStateEdit({ rounds });
  void setDoc(
    rankingRef(state.clock.weekId, uid),
    { uid, weekId: state.clock.weekId, rounds, submitted, updatedAt: Date.now() },
    { merge: true }
  );
}

export function buildUserRankedIds(state: Pick<AppState, "rounds">): string[] {
  return buildRankedIdsPure(state.rounds);
}

// ── The one letter ───────────────────────────────────────────────────────────

export async function sendLetter(body: string): Promise<void> {
  const state = getAppState();
  if (!state.match || state.match.status !== "revealed") return;
  const token = await idToken();
  await fetch("/api/letters", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ weekId: state.clock.weekId, body })
  });
}

// ── Founding cohort ──────────────────────────────────────────────────────────

export type ClaimResult = { spot: "claimed" | "waitlisted"; number: number | null } | null;

/** Claim a numbered founding spot (server-enforced 500/side cap). Also applies
 *  the basic info locally so setup step 1 arrives pre-filled. */
export async function claimFoundingSpot(gender: string, dateOfBirth: string, city: string): Promise<ClaimResult> {
  const token = await idToken();
  if (!token) return null;
  const res = await fetch("/api/claim-spot", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ gender, dateOfBirth, city })
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { spot: "claimed" | "waitlisted"; number: number | null };
  applyProfileEdit({ gender, dateOfBirth, city });
  applyStateEdit({ foundingSpot: data.spot, foundingNumber: data.number });
  return data;
}

// ── The 7-day chat (after a mutual match) ────────────────────────────────────

/** Post a chat message. Delivery is via the messages onSnapshot stream, so no
 *  optimistic write is needed — the new message lands near-instantly. Returns
 *  false if the send was rejected (e.g. the window has closed). */
export async function sendMessage(body: string): Promise<boolean> {
  const state = getAppState();
  const chat = state.chat;
  const text = body.trim();
  if (!chat || !text) return false;
  const token = await idToken();
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ weekId: chat.weekId, body: text })
  });
  return res.ok;
}

// ── Photo upload (Cloudflare R2) ─────────────────────────────────────────────

/** Upload a profile photo to R2 via a presigned URL and return its public URL.
 *  Returns null if storage isn't configured or the upload fails (callers keep
 *  the local blob preview in that case). */
export async function uploadProfilePhoto(file: File, slot: string): Promise<string | null> {
  const token = await idToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, slot })
    });
    if (!res.ok) return null;
    const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!put.ok) return null;
    return publicUrl || null;
  } catch {
    return null;
  }
}

// ── Dev-only time controls ───────────────────────────────────────────────────

export function advanceDay() {
  setDevOffset(getDevOffset() + 86_400_000);
}

export function jumpToWednesday() {
  const state = getAppState();
  if (state.clock.msToReveal > 0) {
    setDevOffset(getDevOffset() + state.clock.msToReveal + 60_000);
  }
}

export async function runAllocationNow(): Promise<void> {
  const token = await idToken();
  const weekId = computeWeekClock(nowWithOffset()).weekId;
  await fetch("/api/dev/allocate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ weekId })
  });
}

export function resetDemo() {
  setDevOffset(0);
}
