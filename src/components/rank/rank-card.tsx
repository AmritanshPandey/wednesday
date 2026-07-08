"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconChevronRight, IconGripVertical } from "@tabler/icons-react";
import type { Profile } from "@/types/profile";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { cn } from "@/lib/utils/cn";

/** One draggable postcard row in a ranking round. */
export function RankCard({
  id,
  index,
  profile,
  onView
}: {
  id: string;
  index: number;
  profile: Profile;
  onView: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "paper-texture relative flex items-center gap-3 rounded-[16px] border border-border bg-card p-3 shadow-postcard",
        isDragging && "z-10 border-primary shadow-soft"
      )}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${profile.name}`}
        className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary active:cursor-grabbing self-center"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="h-5 w-5" stroke={1.8} />
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-sans font-bold leading-none text-primary-foreground">
        <span className="leading-none">{index + 1}</span>
      </div>

      <ProfilePhoto
        name={profile.name}
        src={profile.photoUrl}
        className="h-16 w-14 shrink-0 rounded-[8px] border-[3px] border-card shadow-sm"
      />
      <button type="button" onClick={onView} className="min-w-0 flex-1 text-left">
        <p className="truncate">
          <span className="font-serif text-lg font-semibold text-primary">{profile.name}, {profile.age}</span>
        </p>
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {profile.role}
        </p>
        <p className="truncate text-xs font-semibold text-foreground/70">{profile.city}</p>
      </button>
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${profile.name}'s full profile`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary self-center"
      >
        <IconChevronRight className="h-4 w-4" stroke={2.2} />
      </button>

    </li>
  );
}
