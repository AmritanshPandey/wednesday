"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useDemoState } from "@/lib/demo/demo-store";

export function AppHeader() {
  const state = useDemoState();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-6 pb-4 pt-6 backdrop-blur">
      <Link href="/home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="block font-serif text-3xl font-semibold text-primary">Wednesday</span>
        <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          A thoughtful introduction
        </span>
      </Link>
      <Link href="/profile" aria-label="Open profile" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar
          name={state.profile.name || "You"}
          src={state.profile.localPhotoUrl ?? state.profile.photoUrl}
          className="h-10 w-10 border-2 border-gold"
        />
      </Link>
    </header>
  );
}
