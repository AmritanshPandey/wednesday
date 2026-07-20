"use client";

import * as React from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  sheet?: boolean;
};

export function Dialog({ open, onOpenChange, title, description, children, className, sheet }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  // Prevent background page scrolling when dialog is open
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-foreground/25 backdrop-blur-sm",
        // Sheets hug the bottom on phones but become a centered, width-capped
        // card on desktop — a full-viewport-wide sheet reads broken there.
        sheet ? "items-end sm:items-center sm:p-6" : "items-end pt-4 sm:items-center"
      )}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        className={cn(
          sheet
            ? "w-full rounded-t-[20px] border border-border bg-card p-4 pb-8 shadow-soft paper-postcard sm:max-w-xl sm:rounded-[24px] sm:p-6"
            : "w-full max-w-md rounded-t-[24px] border border-border bg-card p-5 shadow-soft paper-texture",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="font-serif text-2xl text-foreground">
              {title}
            </h2>
            {description ? (
              <p id="dialog-description" className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close dialog" onClick={() => onOpenChange(false)}>
            <IconX className="h-4 w-4" stroke={2.2} />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
