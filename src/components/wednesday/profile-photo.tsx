"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/formatting";

/**
 * Plain <img> with a monogram fallback so a dead remote photo never breaks
 * the postcard layout.
 */
export function ProfilePhoto({
  name,
  src,
  className,
  imgClassName
}: {
  name: string;
  src?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-secondary text-secondary-foreground",
        className
      )}
    >
      <span className="font-serif text-2xl">{initials(name)}</span>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name}'s photo`}
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
        />
      ) : null}
    </div>
  );
}
