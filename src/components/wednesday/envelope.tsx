"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { CancellationLines, Stamp } from "@/components/wednesday/stamp";

/** A small amber wax seal — reserved for meaningful moments. */
export function WaxSeal({ className, letter = "W", size = 56 }: { className?: string; letter?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 -rotate-6 items-center justify-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 30%, #F08A1F 0%, #E17100 42%, #B85A00 100%)",
        boxShadow: "inset 0 2px 3px rgba(255,235,200,0.5), inset 0 -3px 5px rgba(90,40,0,0.35), 0 3px 8px rgba(90,40,0,0.25)"
      }}
    >
      <span
        className="absolute inset-[13%] rounded-full"
        style={{ boxShadow: "inset 0 1px 2px rgba(90,40,0,0.4), inset 0 -1px 2px rgba(255,235,200,0.35)" }}
      />
      <span className="relative font-serif font-bold text-[#FEF9EE]" style={{ fontSize: size * 0.42, textShadow: "0 1px 1px rgba(90,40,0,0.45)" }}>
        {letter}
      </span>
    </span>
  );
}

/**
 * The Wednesday envelope. Closed, it waits; `open` lifts the flap and the
 * note inside rises. Layers, bottom to top: back panel → note → paper
 * pocket → flap (which drops behind the note once opened). All CSS/SVG
 * transforms — nothing WebGL here.
 */
export function Envelope({
  open = false,
  addressee,
  seed = "wednesday",
  sealed = false,
  className,
  children
}: {
  open?: boolean;
  addressee?: string;
  seed?: string;
  /** Amber wax seal on the flap tip while closed. */
  sealed?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const spring = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.32, 0.72, 0.24, 1] as const };

  return (
    <div className={cn("relative mx-auto h-56 w-64", className)} style={{ perspective: 900 }} aria-hidden>
      {/* Back panel with darker inner throat */}
      <div className="absolute inset-x-0 bottom-0 top-14 rounded-[10px] bg-primary shadow-soft" />
      <div className="absolute inset-x-1 top-14 h-14 rounded-t-[9px] bg-[#003a2c]" />

      {/* The note inside */}
      <motion.div
        initial={false}
        animate={open ? { y: -58 } : { y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { ...spring, delay: open ? 0.18 : 0 }}
        className="paper-texture absolute inset-x-5 bottom-4 z-10 flex h-40 items-center justify-center rounded-[8px] border border-border bg-card shadow-sm"
      >
        {children ?? (
          <p className="handwritten px-4 text-center text-2xl leading-snug text-primary">
            {addressee ? `For ${addressee}` : "For you"}
          </p>
        )}
      </motion.div>

      {/* Paper pocket (front of the envelope) */}
      <div className="absolute inset-x-0 bottom-0 top-[6.5rem] z-20 overflow-hidden rounded-b-[10px]">
        <div className="paper-texture absolute inset-0 border border-border bg-card" />
        <svg viewBox="0 0 256 96" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path d="M0 2 l116 62 q12 7 24 0 L256 2" fill="none" stroke="rgba(0,79,59,0.16)" strokeWidth="1.4" />
        </svg>
        <div className="absolute left-4 top-4">
          <CancellationLines className="h-4 w-12" />
        </div>
        <div className="absolute right-3 top-3">
          <Stamp seed={seed} className="h-14 w-12" />
        </div>
        {addressee ? (
          <p className="handwritten absolute inset-x-4 bottom-3 truncate text-center text-xl text-primary/85">
            for {addressee}
          </p>
        ) : null}
      </div>

      {/* Flap */}
      <motion.div
        initial={false}
        animate={open ? { rotateX: 178 } : { rotateX: 0 }}
        transition={spring}
        className={cn("absolute inset-x-0 top-14", open ? "z-[5]" : "z-30")}
        style={{ transformOrigin: "top center", backfaceVisibility: "hidden" }}
      >
        <svg viewBox="0 0 256 92" className="block w-full">
          <path d="M2 0 h252 l-114 84 q-12 9 -24 0 z" fill="#004F3B" stroke="#003a2c" strokeWidth="1.5" />
        </svg>
        {sealed && !open ? (
          <span className="absolute left-1/2 top-[52px] -translate-x-1/2">
            <WaxSeal size={44} />
          </span>
        ) : null}
      </motion.div>
    </div>
  );
}
