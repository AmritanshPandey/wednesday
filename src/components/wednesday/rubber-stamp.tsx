import { cn } from "@/lib/utils/cn";

/**
 * An office hand-stamp pressed onto the paper — the house mark for anything
 * completed or received. Rotation and the double ring live in globals.css;
 * `animate` plays the one-shot press-in settle (skipped under reduced motion).
 */
export function RubberStamp({
  children,
  className,
  animate = true
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return <span className={cn("rubber-stamp", animate && "rubber-stamp-in", className)}>{children}</span>;
}
