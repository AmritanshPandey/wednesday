"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { rankingComplete } from "@/lib/app/actions";
import { useDemoState } from "@/lib/app/store";
import { REVEAL_DAY } from "@/types/clock";

export function AppHeader() {
  const state = useDemoState();
  const pathname = usePathname();

  const weekHref = rankingComplete(state) || state.dayIndex >= REVEAL_DAY ? "/match" : "/rank";
  const navItems = [
    { href: "/home", label: "Home", activeOn: ["/home"] },
    { href: weekHref, label: "This week", activeOn: ["/rank", "/match"] },
    { href: "/profile", label: "Profile", activeOn: ["/profile"] }
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/95 px-6 pb-4 pt-6 backdrop-blur">
      <Link href="/home" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="block font-serif text-3xl font-semibold text-primary">Wednesday</span>
        <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          A thoughtful introduction
        </span>
      </Link>

      {/* Desktop navigation — the bottom bar hides itself on lg. */}
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = item.activeOn.some((prefix) => pathname.startsWith(prefix));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-bold text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-secondary text-primary"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/profile"
        aria-label="Open profile"
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar
          name={state.profile.name || "You"}
          src={state.profile.localPhotoUrl ?? state.profile.photoUrl}
          className="h-10 w-10 border-2 border-gold"
        />
      </Link>
    </header>
  );
}
