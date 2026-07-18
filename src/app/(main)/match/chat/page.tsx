"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronLeft, IconClock, IconSend } from "@tabler/icons-react";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { sendMessage } from "@/lib/app/actions";
import { useDemoState, useStoreHydrated } from "@/lib/app/store";
import { chatWindow, formatChatRemaining } from "@/lib/chat";
import { cn } from "@/lib/utils/cn";

const MAX_MESSAGE = 2000;

export default function ChatPage() {
  const state = useDemoState();
  const hydrated = useStoreHydrated();
  const router = useRouter();
  const chat = state.chat;

  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [rejected, setRejected] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Recompute the countdown each minute so "closes in 3h" stays honest and the
  // composer flips to read-only the moment the window lapses.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (hydrated && !chat) router.replace("/match");
  }, [hydrated, chat, router]);

  // Keep the latest message in view as the stream grows.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [state.messages.length]);

  if (!chat) return null;

  const window_ = chatWindow(chat.connectedAt, now);
  const canSend = window_.open && !sending;

  async function onSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setRejected(false);
    const ok = await sendMessage(text);
    setSending(false);
    if (ok) setDraft("");
    else setRejected(true); // window closed under them, or a transient failure
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/match" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
          <IconChevronLeft className="h-5 w-5" stroke={2} />
        </Link>
        <ProfilePhoto name={chat.matchName} src={chat.matchPhotoUrl ?? undefined} className="h-10 w-10 shrink-0 rounded-full text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg leading-tight text-foreground">{chat.matchName}</p>
          <p className={cn("flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide", window_.open ? "text-accent" : "text-muted-foreground")}>
            <IconClock className="h-3 w-3" stroke={2.4} />
            {window_.open ? formatChatRemaining(window_.msRemaining) : "Conversation closed"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-3 px-4 pb-40 pt-5">
        <p className="mx-auto max-w-[30ch] text-center font-serif text-sm italic leading-6 text-muted-foreground">
          Two letters became a conversation. You have seven days — make them count.
        </p>
        {state.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.author === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                m.author === "user"
                  ? "rounded-br-[6px] bg-primary text-primary-foreground"
                  : "paper-texture rounded-bl-[6px] border border-border text-foreground"
              )}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer / closed banner */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:max-w-[560px]">
        {window_.open ? (
          <>
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={1}
                placeholder={`Message ${chat.matchName}…`}
                aria-label="Message"
                className="max-h-32 min-h-12 flex-1 resize-none rounded-[20px] border border-input bg-card px-4 py-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend || draft.trim().length === 0}
                aria-label="Send"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconSend className="h-5 w-5" stroke={2} />
              </button>
            </div>
            {rejected ? (
              <p className="mt-2 text-center text-xs font-semibold text-destructive">
                Couldn&apos;t send — the window may have just closed. Refresh to see the latest.
              </p>
            ) : null}
          </>
        ) : (
          <p className="py-2 text-center text-sm font-semibold leading-6 text-muted-foreground">
            This conversation has closed. The letters and messages stay here — a keepsake of the connection.
          </p>
        )}
      </div>
    </div>
  );
}
