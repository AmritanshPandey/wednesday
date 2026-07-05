import { cn } from "@/lib/utils/cn";

export type PipelineStep = {
  title: string;
  detail: string;
  figure?: string;
};

/** The weekly allocation pipeline: Filter → Score → Rank → Introduce. */
export function PipelineDiagram({ steps, className }: { steps: PipelineStep[]; className?: string }) {
  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
          {index < steps.length - 1 ? (
            <span className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px border-l border-dashed border-primary/30" aria-hidden />
          ) : null}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-sm font-bold text-primary-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-bold">{step.title}</p>
              {step.figure ? <p className="shrink-0 font-serif text-lg font-semibold text-accent">{step.figure}</p> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
