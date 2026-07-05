"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function DropdownMenu({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      {open ? <div className="absolute right-0 top-full z-40 mt-2 min-w-40 rounded-lg border border-border bg-card p-2 shadow-soft">{children}</div> : null}
    </div>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />;
}
