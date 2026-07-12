import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        // text-base (16px): anything smaller makes iOS Safari zoom in on focus.
        "h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}
