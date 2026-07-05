"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconHomeFilled,
  IconMailbox,
  IconMailOpenedFilled,
  IconUserCircle,
  IconUserFilled
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";
import { rankingComplete } from "@/lib/demo/demo-actions";
import { useDemoState } from "@/lib/demo/demo-store";
import { REVEAL_DAY } from "@/types/clock";

export function BottomNavigation() {
  const pathname = usePathname();
  const state = useDemoState();

  if (pathname === "/match") return null;

  const weekHref = rankingComplete(state) || state.dayIndex >= REVEAL_DAY ? "/match" : "/rank";
  const navItems = [
    { href: "/home", label: "Home", icon: IconHome, activeIcon: IconHomeFilled, activeOn: ["/home"] },
    { href: weekHref, label: "This week", icon: IconMailbox, activeIcon: IconMailOpenedFilled, activeOn: ["/rank", "/match"] },
    { href: "/profile", label: "Profile", icon: IconUserCircle, activeIcon: IconUserFilled, activeOn: ["/profile"] }
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-3 gap-1 rounded-full border border-border bg-card/95 p-2 shadow-sm backdrop-blur">
        {navItems.map((item) => {
          const active = item.activeOn.some((prefix) => pathname.startsWith(prefix));
          const Icon = active ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "text-primary"
              )}
            >
              {active ? <Icon className="h-6 w-6" /> : <Icon className="h-6 w-6" stroke={1.9} />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
