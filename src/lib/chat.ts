// The 7-day chat window that opens when a match becomes mutual (`connected`).
// One source of truth for both the server send-guard and the UI countdown, so
// the two can never disagree about whether a conversation is still open.

export const CHAT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ChatWindow = {
  /** Whether new messages may still be sent. */
  open: boolean;
  /** Milliseconds until the window closes (0 once closed). */
  msRemaining: number;
  /** Absolute close time (connectedAt + 7 days), or null if never connected. */
  closesAt: number | null;
};

/** The state of the chat window for a match connected at `connectedAt`. A
 *  missing `connectedAt` means the pair never became mutual — window closed. */
export function chatWindow(connectedAt: number | null | undefined, now: number = Date.now()): ChatWindow {
  if (!connectedAt) return { open: false, msRemaining: 0, closesAt: null };
  const closesAt = connectedAt + CHAT_WINDOW_MS;
  const msRemaining = Math.max(0, closesAt - now);
  return { open: msRemaining > 0, msRemaining, closesAt };
}

/** Short human countdown for the header — "6 days left", "5h left", "12m left". */
export function formatChatRemaining(msRemaining: number): string {
  if (msRemaining <= 0) return "closed";
  const minutes = Math.floor(msRemaining / 60_000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, minutes)}m left`;
}
