"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signOutUser, useDemoState } from "@/lib/app/store";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";
const SEED_PASSWORD = "test1234";

// The seed script (npm run seed) creates member01..memberNN@wednesday.test.
// member01 & member02 are pre-connected, so logging in as either shows a live chat.
const QUICK = [
  { email: "member01@wednesday.test", label: "member01 (has a live chat)" },
  { email: "member02@wednesday.test", label: "member02 (the other side of that chat)" },
  { email: "member03@wednesday.test", label: "member03" },
  { email: "member04@wednesday.test", label: "member04" }
];

/**
 * Dev-only sign-in for testing the UI as seeded fake accounts against the local
 * emulator. Renders nothing useful unless the app is running in emulator mode,
 * so it can never be a login backdoor in production.
 */
export default function DevLoginPage() {
  const state = useDemoState();
  const router = useRouter();
  const [email, setEmail] = React.useState("member01@wednesday.test");
  const [password, setPassword] = React.useState(SEED_PASSWORD);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (!USE_EMULATOR) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="font-serif text-2xl">Dev login is off</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Run <code className="rounded bg-secondary px-1.5 py-0.5">npm run dev:emulator</code> and seed fake accounts
          with <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code> to use this page.
        </p>
      </div>
    );
  }

  async function login(withEmail: string) {
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(withEmail, password);
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Emulator · dev only</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold">Log in as a fake member</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {state.signedIn ? `Signed in as ${state.authName ?? state.uid}.` : "Pick a seeded account, or type any seeded email."}
      </p>

      <div className="mt-6 space-y-2">
        {QUICK.map((q) => (
          <button
            key={q.email}
            type="button"
            disabled={busy}
            onClick={() => login(q.email)}
            className="flex w-full items-center justify-between rounded-[14px] border border-border bg-card px-4 py-3 text-left text-sm font-bold transition hover:bg-secondary disabled:opacity-50"
          >
            <span>{q.label}</span>
            <span className="text-xs font-semibold text-muted-foreground">{q.email}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-[16px] border border-border bg-card p-4">
        <p className="text-sm font-bold">Or any seeded account</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member12@wednesday.test"
          className="h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          disabled={busy || !email}
          onClick={() => login(email)}
          className="h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error}</p> : null}

      {state.signedIn ? (
        <button type="button" onClick={() => signOutUser()} className="mt-6 text-sm font-bold text-muted-foreground underline">
          Sign out
        </button>
      ) : null}
    </div>
  );
}
