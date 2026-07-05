"use client";

import Link from "next/link";
import { IconPencil } from "@tabler/icons-react";
import { ProfileDetail } from "@/components/wednesday/profile-detail";
import { useDemoState } from "@/lib/demo/demo-store";
import { PREFERENCE_SECTIONS } from "@/types/preferences";

export default function ProfilePage() {
  const state = useDemoState();
  const dealBreakerCount = PREFERENCE_SECTIONS.filter((section) => state.preferences.dealBreakers[section]).length;

  return (
    <div className="px-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Your postcard</h1>
        <Link
          href="/setup/1"
          className="inline-flex items-center gap-1.5 rounded-full border border-gold px-3.5 py-2 text-xs font-bold hover:bg-secondary"
        >
          <IconPencil className="h-3.5 w-3.5" stroke={2.2} />
          Edit
        </Link>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        This is what your Wednesday introductions read. {dealBreakerCount} deal-breakers protect your pool.
      </p>
      <div className="mt-5">
        <ProfileDetail profile={state.profile} />
      </div>
    </div>
  );
}
