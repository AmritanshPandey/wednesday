import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        // text-base (16px): anything smaller makes iOS Safari zoom in on focus.
        "min-h-28 w-full rounded-md border border-input bg-card px-3 py-3 text-base leading-6 outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}
