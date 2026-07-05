"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Toast({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-soft", className)}>{children}</div>;
}
