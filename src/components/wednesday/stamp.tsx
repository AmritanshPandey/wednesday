import { cn } from "@/lib/utils/cn";
import { hashString } from "@/lib/matching/random";

/**
 * Postal system: a perforated stamp with a personal line-art motif, a
 * circular postmark, and cancellation lines. Forest-green ink on warm
 * paper; amber reserved for moments that deserve it.
 */

export type StampMotif = "branch" | "teacup" | "book" | "mountains" | "music" | "letter" | "bicycle" | "sun";

const MOTIFS: StampMotif[] = ["branch", "teacup", "book", "mountains", "music", "letter", "bicycle", "sun"];

/** Deterministic personal motif — every profile mails with their own stamp. */
export function motifForSeed(seed: string): StampMotif {
  return MOTIFS[hashString(seed) % MOTIFS.length];
}

/** Line-art motifs drawn in a 44×44 box, stroke-only, currentColor ink. */
function MotifArt({ motif }: { motif: StampMotif }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (motif) {
    case "teacup":
      return (
        <g {...stroke}>
          <path d="M10 20 h22 v7 a11 11 0 0 1 -22 0 z" />
          <path d="M32 22 q7 0 6 5 q-1 4.5 -7 4" />
          <path d="M8 38 h28" />
          <path d="M17 15 q-1.5 -3 0 -5.5 M23 15 q-1.5 -3 0 -5.5" />
        </g>
      );
    case "book":
      return (
        <g {...stroke}>
          <path d="M22 12 q-7 -4 -14 -2 v24 q7 -2 14 2 q7 -4 14 -2 v-24 q-7 -2 -14 2 z" />
          <path d="M22 12 v24" />
          <path d="M12 18 q5 -1.5 7 -0.5 M12 23 q5 -1.5 7 -0.5" />
        </g>
      );
    case "mountains":
      return (
        <g {...stroke}>
          <path d="M6 34 l10 -15 l6 8 l7 -11 l9 18 z" />
          <path d="M16 19 l3 4.5 M29 16 l3 5" />
          <circle cx="33" cy="11" r="3.2" />
        </g>
      );
    case "music":
      return (
        <g {...stroke}>
          <path d="M17 32 v-19 l14 -3.5 v18" />
          <ellipse cx="13.5" cy="32" rx="3.8" ry="3" />
          <ellipse cx="27.5" cy="27.5" rx="3.8" ry="3" />
        </g>
      );
    case "letter":
      return (
        <g {...stroke}>
          <rect x="8" y="13" width="28" height="19" rx="2.5" />
          <path d="M8 15 l14 10 l14 -10" />
        </g>
      );
    case "bicycle":
      return (
        <g {...stroke}>
          <circle cx="13" cy="30" r="6.5" />
          <circle cx="31" cy="30" r="6.5" />
          <path d="M13 30 l6 -12 h9 l3 12 M19 18 l4 12 M17 15 h5" />
        </g>
      );
    case "sun":
      return (
        <g {...stroke}>
          <circle cx="22" cy="22" r="7" />
          <path d="M22 9 v-3 M22 38 v-3 M9 22 h-3 M38 22 h-3 M12.5 12.5 l-2.2 -2.2 M33.7 33.7 l-2.2 -2.2 M12.5 31.5 l-2.2 2.2 M33.7 10.3 l-2.2 2.2" />
        </g>
      );
    case "branch":
    default:
      return (
        <g {...stroke}>
          <path d="M14 36 q4 -14 16 -24" />
          <path d="M20 27 q-5 -1.5 -7 -6 q6 -0.5 8 4" />
          <path d="M24 21 q-1 -5.5 2.5 -9.5 q3 4.5 -0.5 9" />
          <path d="M20.5 27.5 q6 -1 9.5 2.5 q-5.5 3 -9.5 -1" />
        </g>
      );
  }
}

export function Stamp({
  className,
  value = "30",
  motif,
  seed,
  tone = "green"
}: {
  className?: string;
  value?: string;
  motif?: StampMotif;
  seed?: string;
  tone?: "green" | "amber";
}) {
  const art = motif ?? (seed ? motifForSeed(seed) : "branch");
  const ink = tone === "amber" ? "#E17100" : "#004F3B";
  const holes: React.ReactNode[] = [];
  // Perforation holes cut along the sheet edges.
  for (let x = 4; x <= 84; x += 8) {
    holes.push(<circle key={`t${x}`} cx={x} cy={0} r={3} fill="black" />);
    holes.push(<circle key={`b${x}`} cx={x} cy={104} r={3} fill="black" />);
  }
  for (let y = 4; y <= 100; y += 8) {
    holes.push(<circle key={`l${y}`} cx={0} cy={y} r={3} fill="black" />);
    holes.push(<circle key={`r${y}`} cx={88} cy={y} r={3} fill="black" />);
  }

  return (
    <svg viewBox="0 0 88 104" className={cn("h-14 w-12 rotate-2 drop-shadow-sm", className)} aria-hidden>
      <defs>
        <mask id={`stamp-perf-${art}-${tone}`}>
          <rect width="88" height="104" fill="white" />
          {holes}
        </mask>
      </defs>
      <g mask={`url(#stamp-perf-${art}-${tone})`}>
        <rect width="88" height="104" fill="#FFFDF6" />
        <rect width="88" height="104" fill={ink} opacity="0.05" />
      </g>
      <rect x="7.5" y="7.5" width="73" height="89" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.55" rx="2" />
      <g transform="translate(22 22)" color={ink} opacity="0.9">
        <MotifArt motif={art} />
      </g>
      <text x="72" y="22" textAnchor="end" fontSize="13" fontWeight="700" fill={ink} fontFamily="Georgia, serif">
        {value}
      </text>
      <text x="44" y="88" textAnchor="middle" fontSize="7.5" letterSpacing="2.6" fontWeight="700" fill={ink} opacity="0.75">
        WEDNESDAY
      </text>
    </svg>
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
