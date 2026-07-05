"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAdjustmentsHorizontal,
  IconBrandLinkedin,
  IconCalendarDue,
  IconCameraCheck,
  IconChevronLeft,
  IconCircleCheckFilled,
  IconHeart,
  IconMapPin,
  IconPhone,
  IconPhoto,
  IconRosetteDiscountCheckFilled,
  IconScan,
  IconSparkles,
  IconUserCheck
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { completeSetupAndJoin } from "@/lib/demo/demo-actions";
import { useDemoState } from "@/lib/demo/demo-store";
import type { Profile } from "@/types/profile";

type ReviewIcon = React.ComponentType<{ className?: string; stroke?: number }>;
type ReadinessItem = { label: string; status: string; icon: ReviewIcon };

function readinessItems(profile: Profile): ReadinessItem[] {
  const photoCount = [profile.localPhotoUrl ?? profile.photoUrl, ...(profile.extraPhotoUrls ?? [])].filter(Boolean).length;
  const visualPromptCount = profile.moments.filter((moment) => moment.title || moment.caption || moment.imageUrl).length;

  return [
    { label: "Profile readiness", status: "Completed", icon: IconUserCheck },
    { label: "Photos", status: `${Math.min(photoCount, 4)}/4 added`, icon: IconPhoto },
    { label: "Visual prompts", status: `${Math.min(visualPromptCount, 3)}/3 added`, icon: IconSparkles },
    { label: "Match preferences", status: "Completed", icon: IconAdjustmentsHorizontal },
    { label: "Phone number", status: "Completed", icon: IconPhone },
    { label: "LinkedIn verified", status: "Verified", icon: IconBrandLinkedin },
    { label: "Photo verification", status: "Verified", icon: IconCameraCheck }
  ];
}

function ReadinessRow({ item }: { item: ReadinessItem }) {
  const Icon = item.icon;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-primary">
          <Icon className="h-5 w-5" stroke={2.1} />
        </span>
        <span className="truncate text-[15px] font-bold text-foreground">{item.label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary">
        <span>{item.status}</span>
        <IconCircleCheckFilled className="h-4.5 w-4.5" />
      </div>
    </div>
  );
}

function InterestChip({ label }: { label: string }) {
  return <Badge className="h-8 rounded-[9px] px-3 font-bold">{label}</Badge>;
}

function ProfileSummaryCard({ profile }: { profile: Profile }) {
  const visibleInterests = profile.interests.slice(0, 3);

  return (
    <section className="paper-texture rounded-[18px] border border-border bg-card p-4 shadow-postcard">
      <div className="grid grid-cols-[44%_1fr] gap-4">
        <ProfilePhoto
          name={profile.name}
          src={profile.localPhotoUrl ?? profile.photoUrl}
          className="aspect-[0.82] min-h-48 rounded-[12px] border-4 border-card bg-secondary shadow-sm"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-serif text-2xl font-semibold leading-tight text-primary">
              {profile.name}, {profile.age}
            </h2>
            <IconRosetteDiscountCheckFilled className="h-5 w-5 shrink-0 text-accent" />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <IconMapPin className="h-4 w-4 shrink-0" stroke={2.1} />
            <span className="truncate">{profile.city}</span>
          </p>

          <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-foreground/80">
            {profile.role}
            {profile.industry ? ` in ${profile.industry}` : null}
          </p>

          <div className="mt-4 rounded-[10px] bg-secondary p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold leading-5 text-secondary-foreground">{profile.intent}</p>
              <IconHeart className="h-5 w-5 shrink-0 text-primary" stroke={2.1} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleInterests.map((interest) => (
              <InterestChip key={interest} label={interest} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold">
        <div className="flex items-center gap-2 text-primary">
          <IconRosetteDiscountCheckFilled className="h-5 w-5 shrink-0" />
          <span>Phone verified</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconScan className="h-5 w-5 shrink-0" stroke={2} />
          <span>Photo verification needed</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href="/setup/1"
          className="flex h-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground transition hover:bg-primary/92"
        >
          Edit
        </Link>
        <Link
          href="/profile"
          className="flex h-12 items-center justify-center rounded-full border border-gold bg-card text-base font-bold text-foreground transition hover:bg-secondary"
        >
          View
        </Link>
      </div>
    </section>
  );
}

function DeadlineCard() {
  return (
    <section className="flex items-center gap-4 rounded-[18px] border border-gold bg-secondary px-5 py-5 text-secondary-foreground">
      <IconCalendarDue className="h-11 w-11 shrink-0 text-primary" stroke={2.1} />
      <div>
        <p className="text-sm font-semibold text-secondary-foreground/80">Complete verification by</p>
        <p className="mt-1 font-serif text-xl font-semibold text-primary">Tuesday, 11:59 PM</p>
        <p className="mt-1 text-sm font-semibold text-secondary-foreground/80">to be considered for this Wednesday.</p>
      </div>
    </section>
  );
}

export default function ReviewPage() {
  const state = useDemoState();
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-background px-5 pb-8 text-foreground">
      <header className="sticky top-0 z-20 -mx-5 bg-background/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link href="/setup/11" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
            <IconChevronLeft className="h-5 w-5" stroke={2.2} />
          </Link>
          <span className="text-sm font-bold">Review profile</span>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="flex-1">
        <section className="pt-5">
          <div className="flex items-center gap-2 text-primary">
            <IconUserCheck className="h-7 w-7" stroke={2.3} />
            <h1 className="font-serif text-3xl font-semibold leading-tight">Your profile is ready</h1>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
            Review the essentials, verify your profile, and you'll be ready for Wednesday.
          </p>
        </section>

        <section className="mt-7">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Profile readiness</h2>
          <div className="mt-4 overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
            {readinessItems(state.profile).map((item) => (
              <ReadinessRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        <div className="mt-7 space-y-5 pb-7">
          <ProfileSummaryCard profile={state.profile} />
          <DeadlineCard />
        </div>
      </div>

      <footer className="sticky bottom-0 -mx-5 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            completeSetupAndJoin();
            router.push("/home");
          }}
        >
          Verify and join this week
        </Button>
      </footer>
    </main>
  );
}
