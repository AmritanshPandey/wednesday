import { cn } from "@/lib/utils/cn";

/** A little postage stamp — the postcard motif that makes it feel like mail. */
export function Stamp({ className, value = "W" }: { className?: string; value?: string }) {
  return (
    <div
      className={cn(
        "flex h-14 w-12 shrink-0 rotate-2 items-center justify-center rounded-[4px] border border-gold bg-secondary p-1 shadow-sm",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 0 0, transparent 3px, var(--secondary) 3px), radial-gradient(circle at 100% 0, transparent 3px, var(--secondary) 3px)"
      }}
      aria-hidden
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[2px] border border-primary/30 bg-card/60">
        <span className="text-base leading-none">🌿</span>
        <span className="text-[9px] font-bold tracking-widest text-primary">{value}</span>
      </div>
    </div>
  );
}

/** Circular "WEDNESDAY · WITH INTENT" postmark. */
export function Postmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-16 w-16 -rotate-12 text-primary/50", className)} aria-hidden>
      <defs>
        <path id="postmark-circle" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
      </defs>
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontSize="10.5" fill="currentColor" letterSpacing="2.2" fontWeight="700">
        <textPath href="#postmark-circle">WEDNESDAY · WITH INTENT ·</textPath>
      </text>
      <text x="50" y="54" textAnchor="middle" fontSize="9" fill="currentColor" fontWeight="700">
        POSTED
      </text>
    </svg>
  );
}

/** Three wavy cancellation lines, usually placed beside the stamp. */
export function CancellationLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 24" className={cn("h-5 w-14 text-primary/40", className)} aria-hidden>
      {[4, 12, 20].map((y) => (
        <path
          key={y}
          d={`M 2 ${y} q 8 -3 16 0 t 16 0 t 16 0 t 12 0`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
