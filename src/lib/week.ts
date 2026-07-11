// Real weekly cycle math, in IST (Asia/Kolkata, a fixed +05:30 with no DST).
//
// A cycle is identified by its reveal Wednesday, as `YYYY-MM-DD` (the IST date).
// Timeline within a cycle:
//   • Thu 00:00  → pool built, ranking window opens
//   • Thu–Tue    → ranking window
//   • Wed 09:00  → allocation runs, introductions revealed
//   • Thu 21:00  → move deadline (letter must be posted)
//   • after      → replies land, week winds down
//
// The UI still speaks in a 0..8 "dayIndex" (Thu … next Fri) so the existing
// screens keep working; `dayIndexFromPhase` maps real time onto that scale.

export const IST_OFFSET_MIN = 5 * 60 + 30;

export const REVEAL_HOUR_IST = 9; // Wednesday 09:00
export const DEADLINE_HOUR_IST = 21; // Thursday 21:00

export type CyclePhase =
  | "ranking" // pool is open, rank your people
  | "sealed" // ranking done for you / window closing, waiting for Wednesday
  | "reveal" // Wednesday: introductions are out
  | "deadline" // Thursday: last day to send a letter
  | "winddown"; // after Thursday, before next Thursday's new pool

export type WeekClock = {
  /** Reveal-Wednesday date, e.g. "2026-07-08" — the cycle id. */
  weekId: string;
  phase: CyclePhase;
  /** 0..8 scale the legacy UI expects (6 = Wednesday reveal, 7 = Thursday). */
  dayIndex: number;
  /** ms until the next reveal Wednesday 09:00 IST (for countdowns). */
  msToReveal: number;
  /** ms until this cycle's Thursday deadline. */
  msToDeadline: number;
  nowUtcMs: number;
};

/** A Date's wall-clock fields as seen in IST. */
function istParts(utcMs: number) {
  const ist = new Date(utcMs + IST_OFFSET_MIN * 60_000);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
    dow: ist.getUTCDay() // 0 Sun … 6 Sat
  };
}

/** UTC ms for a given IST wall-clock moment. */
function istToUtcMs(year: number, month: number, day: number, hour: number, minute = 0): number {
  return Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MIN * 60_000;
}

function ymd(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** The reveal Wednesday 09:00 (UTC ms) for the cycle that `utcMs` falls in.
 *  A cycle owns time from its reveal Wednesday 09:00 until the following
 *  Thursday 00:00 (when the next cycle's ranking window opens). */
function currentRevealUtcMs(utcMs: number): number {
  const { year, month, day, dow } = istParts(utcMs);
  // The next Wednesday 09:00 at or after "today" (>= today's date at 09:00).
  const daysToWed = (3 - dow + 7) % 7;
  const upcomingReveal = istToUtcMs(year, month, day + daysToWed, REVEAL_HOUR_IST);
  const prevReveal = upcomingReveal - 7 * 86_400_000;
  // The upcoming cycle's ranking window opens the Thursday before it (reveal − 6d).
  const upcomingWindowOpen = upcomingReveal - 6 * 86_400_000;
  // In the tail of the previous cycle (its Wed 09:00 → this Thursday 00:00),
  // the owning reveal is still the previous Wednesday.
  if (utcMs >= prevReveal && utcMs < upcomingWindowOpen) return prevReveal;
  return upcomingReveal;
}

export function computeWeekClock(nowUtcMs: number = Date.now()): WeekClock {
  const reveal = currentRevealUtcMs(nowUtcMs);
  const r = istParts(reveal);
  const weekId = ymd(r.year, r.month, r.day);

  // Thursday 21:00 after the reveal.
  const deadline = istToUtcMs(r.year, r.month, r.day + 1, DEADLINE_HOUR_IST);
  // Ranking window opened the previous Thursday 00:00.
  const windowOpen = istToUtcMs(r.year, r.month, r.day - 6, 0);

  let phase: CyclePhase;
  let dayIndex: number;
  if (nowUtcMs < reveal) {
    // Thu(0) Fri(1) Sat(2) Sun(3) Mon(4) Tue(5) → dayIndex by days from windowOpen.
    const daysIn = Math.floor((nowUtcMs - windowOpen) / 86_400_000);
    dayIndex = Math.max(0, Math.min(5, daysIn));
    phase = daysIn >= 5 ? "sealed" : "ranking";
  } else if (nowUtcMs < deadline) {
    const { dow } = istParts(nowUtcMs);
    if (dow === 3) {
      phase = "reveal";
      dayIndex = 6;
    } else {
      phase = "deadline";
      dayIndex = 7;
    }
  } else {
    phase = "winddown";
    dayIndex = 8;
  }

  return {
    weekId,
    phase,
    dayIndex,
    msToReveal: reveal - nowUtcMs,
    msToDeadline: deadline - nowUtcMs,
    nowUtcMs
  };
}

/** Human label for a UI dayIndex, e.g. "Wednesday, 8 Jul". */
export function labelForClock(clock: WeekClock): { label: string; short: string; date: string } {
  const d = new Date(clock.nowUtcMs + IST_OFFSET_MIN * 60_000);
  const label = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  const short = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return { label, short, date };
}

/** The reveal Wednesday's own date label, e.g. "8 Jul". */
export function revealDateLabel(weekId: string): string {
  const [y, m, d] = weekId.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
