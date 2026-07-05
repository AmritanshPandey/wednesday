"use client";

import { useSyncExternalStore } from "react";
import { seedDemoState, type DemoState } from "@/lib/demo/seed-data";
import { incomeRangeToTaxBracket, TAX_BRACKETS } from "@/lib/profile-options";

export const DEMO_STATE_KEY = "wednesday-demo-state-v2";

type Listener = () => void;

const listeners = new Set<Listener>();
let memoryState: DemoState = structuredClone(seedDemoState);
let initialized = false;
const TAX_BRACKET_VALUES = new Set<string>(TAX_BRACKETS);

function cloneState(state: DemoState): DemoState {
  return structuredClone(state);
}

function migrateDemoState(state: DemoState): DemoState {
  const profile = state.profile as DemoState["profile"] & {
    incomeRange?: string;
    taxBracket?: string;
  };
  const legacyState = state as DemoState & { lambda?: number };

  profile.taxBracket = incomeRangeToTaxBracket(
    profile.taxBracket ?? profile.incomeRange ?? seedDemoState.profile.taxBracket
  );
  if (!TAX_BRACKET_VALUES.has(profile.taxBracket)) {
    profile.taxBracket = seedDemoState.profile.taxBracket;
  }
  delete profile.incomeRange;
  delete legacyState.lambda;

  return state;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function ensureStateLoaded(): DemoState {
  if (initialized) {
    return memoryState;
  }

  if (!canUseStorage()) {
    initialized = true;
    return memoryState;
  }

  const stored = window.localStorage.getItem(DEMO_STATE_KEY);
  if (!stored) {
    memoryState = cloneState(seedDemoState);
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(memoryState));
    initialized = true;
    return memoryState;
  }

  try {
    memoryState = migrateDemoState(JSON.parse(stored) as DemoState);
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(memoryState));
    initialized = true;
    return memoryState;
  } catch {
    memoryState = cloneState(seedDemoState);
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(memoryState));
    initialized = true;
    return memoryState;
  }
}

export function getDemoState() {
  return ensureStateLoaded();
}

export function saveDemoState(state: DemoState) {
  memoryState = cloneState(state);
  if (canUseStorage()) {
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(memoryState));
  }
  emitChange();
}

export function resetDemoState() {
  saveDemoState(cloneState(seedDemoState));
}

export function subscribeToDemoState(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemoState() {
  return useSyncExternalStore(subscribeToDemoState, getDemoState, () => memoryState);
}

/**
 * True once the client store (backed by localStorage) is in charge. Page
 * guards must wait for this — during hydration the server snapshot is the
 * untouched seed state, and redirecting on it bounces valid deep links.
 */
const noopSubscribe = () => () => {};

export function useStoreHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
