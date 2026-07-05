import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { PipelineDiagram } from "@/components/wednesday/pipeline-diagram";

const PIPELINE = [
  {
    title: "Filter",
    detail:
      "Hard rules first. Your deal-breakers — and theirs — are never crossed. Age, timeline, children, lifestyle: if it's marked non-negotiable, it filters the pool."
  },
  {
    title: "Score",
    detail:
      "Every remaining pairing gets a mutual compatibility score across intent, future plans, everyday lifestyle, values, and interests. A match only counts when it's good for both sides — and we never introduce below 50%."
  },
  {
    title: "Rank",
    detail:
      "Your ranking becomes your preference order for the week. The allocation uses everyone’s submitted ranked preferences directly."
  },
  {
    title: "Introduce",
    detail:
      "Gale-Shapley's deferred acceptance runs across the whole week's market and settles on a stable outcome: no two people would rather drop their matches for each other."
  }
];

export default function HowPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-6 pb-12 pt-6">
      <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
        <IconChevronLeft className="h-5 w-5" stroke={2} />
      </Link>

      <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight">How matching works</h1>
      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
        Wednesday replaces the swipe feed with one considered weekly cycle. You tell us what really matters, rank a
        small pool of genuinely compatible people, and meet one match — on Wednesday.
      </p>

      <section className="mt-8 space-y-4">
        <WeekRow day="Thu – Tue" title="Rank your pool" detail="We find up to 25 people who clear both sides' deal-breakers. You rank them five at a time — five rounds, then a final round of your round winners." />
        <WeekRow day="Wednesday" title="One introduction" detail="The allocation runs across everyone's rankings and reveals your match — like a postcard arriving in the mail." />
        <WeekRow day="Thursday" title="Make your move" detail="You have until Thursday to send one letter introducing yourself. No chat, no games — one thoughtful letter." />
      </section>

      <h2 className="mt-10 font-serif text-2xl font-semibold">The allocation, each Wednesday</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Based on Gale-Shapley (1962), the same algorithm family used for hospital residency matching.
      </p>
      <div className="mt-5 rounded-[18px] border border-border bg-card p-5">
        <PipelineDiagram steps={PIPELINE} />
      </div>

      <Link
        href="/"
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
      >
        Got it
      </Link>
    </main>
  );
}

function WeekRow({ day, title, detail }: { day: string; title: string; detail: string }) {
  return (
    <div className="flex gap-4 rounded-[16px] border border-border bg-card p-4">
      <p className="w-20 shrink-0 pt-0.5 text-xs font-bold uppercase tracking-wide text-accent">{day}</p>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
