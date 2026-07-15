"use client";

import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const SETUP_STEP_COUNT = 12;

/** Groups the numbered setup steps into the sections shown as segmented tabs. */
const SETUP_SECTIONS = [
  { label: "Basics", steps: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: "Photos", steps: [9, 10] },
  { label: "Socials", steps: [11] },
  { label: "Compatibility", steps: [12] }
] as const;

function sectionForStep(step: number) {
  const index = SETUP_SECTIONS.findIndex((section) => (section.steps as readonly number[]).includes(step));
  return index === -1 ? 0 : index;
}

export function StepShell({
  step,
  title,
  subtitle,
  children,
  onNext,
  onSecondary,
  nextLabel = "Next",
  secondaryLabel,
  nextDisabled,
  backHref,
  headerTitle = "Profile setup"
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  onSecondary?: () => void;
  nextLabel?: string;
  secondaryLabel?: string;
  nextDisabled?: boolean;
  backHref: string;
  headerTitle?: string;
}) {
  const activeSectionIndex = sectionForStep(step);
  const activeSection = SETUP_SECTIONS[activeSectionIndex];
  const stepWithinSection = activeSection.steps.indexOf(step as never) + 1;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-background px-5 pb-8 md:max-w-[560px]">
      <header className="sticky top-0 z-20 -mx-5 bg-background/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
          >
            <IconChevronLeft className="h-5 w-5" stroke={2} />
          </Link>
          <span className="text-sm font-bold">{headerTitle}</span>
          <span className="h-9 w-9" />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {SETUP_SECTIONS.map((section, index) => (
            <div key={section.label} className="min-w-0">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  index < activeSectionIndex ? "bg-primary" : index === activeSectionIndex ? "bg-accent" : "bg-muted"
                )}
              />
              <p
                className={cn(
                  "mt-1.5 truncate text-center text-[9px] font-extrabold uppercase tracking-[0.02em] transition-colors duration-300 min-[430px]:text-[10px] min-[430px]:tracking-[0.14em]",
                  index === activeSectionIndex
                    ? "text-foreground"
                    : index < activeSectionIndex
                      ? "text-primary/60"
                      : "text-muted-foreground/60"
                )}
              >
                {section.label}
              </p>
            </div>
          ))}
        </div>
        {activeSection.steps.length > 1 ? (
          <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Step {stepWithinSection} of {activeSection.steps.length}
          </p>
        ) : null}
      </header>

      <main className="flex-1 pt-4">
        <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        <div className="mt-6 space-y-7 pb-10">{children}</div>
      </main>

      <footer className="sticky bottom-0 -mx-5 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {secondaryLabel && onSecondary ? (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="w-full" onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
            </Button>
            <Button size="lg" variant="outline" className="w-full border-primary text-primary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </div>
        ) : (
          <Button size="lg" className="w-full" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        )}
      </footer>
    </div>
  );
}

export function FieldBlock({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[15px] font-bold text-foreground">{label}</p>
      {children}
      {help ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{help}</p> : null}
    </div>
  );
}

export function Callout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-secondary px-4 py-3.5 text-sm leading-6 text-secondary-foreground">
      {title ? <p className="font-bold">{title}</p> : null}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
    </div>
  );
}
