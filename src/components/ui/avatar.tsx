import Image from "next/image";
import * as React from "react";
import { initials } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils/cn";

type AvatarProps = {
  name: string;
  src?: string;
  className?: string;
  priority?: boolean;
};

export function Avatar({ name, src, className, priority }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground", className)}>
      {src && !failed ? (
        <Image
          src={src}
          alt={`${name} profile photo`}
          fill
          className="object-cover"
          sizes="96px"
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
