"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type RangeSelectorValue = {
  min: number;
  max: number;
};

type RangeSelectorProps = {
  min: number;
  max: number;
  value: RangeSelectorValue;
  onChange: (value: RangeSelectorValue) => void;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function percentage(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

export function RangeSelector({
  min,
  max,
  value,
  onChange,
  step = 1,
  minLabel = "From",
  maxLabel = "To",
  formatValue = String,
  className
}: RangeSelectorProps) {
  const [focusedHandle, setFocusedHandle] = React.useState<"min" | "max" | null>(null);
  const minValue = clamp(Math.min(value.min, value.max), min, max);
  const maxValue = clamp(Math.max(value.min, value.max), min, max);
  const minPercent = percentage(minValue, min, max);
  const maxPercent = percentage(maxValue, min, max);

  const updateMin = (nextValue: number) => {
    onChange({ min: Math.min(clamp(nextValue, min, max), maxValue), max: maxValue });
  };

  const updateMax = (nextValue: number) => {
    onChange({ min: minValue, max: Math.max(clamp(nextValue, min, max), minValue) });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-muted-foreground">{minLabel}</p>
          <p className="mt-1 font-serif text-2xl font-semibold leading-none text-primary">{formatValue(minValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-muted-foreground">{maxLabel}</p>
          <p className="mt-1 font-serif text-2xl font-semibold leading-none text-primary">{formatValue(maxValue)}</p>
        </div>
      </div>

      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-primary text-[11px] font-extrabold text-primary-foreground shadow-postcard transition",
            focusedHandle === "min" && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          )}
          style={{ left: `${minPercent}%` }}
        >
          {formatValue(minValue)}
        </div>
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-primary text-[11px] font-extrabold text-primary-foreground shadow-postcard transition",
            focusedHandle === "max" && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          )}
          style={{ left: `${maxPercent}%` }}
        >
          {formatValue(maxValue)}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          aria-label={minLabel}
          onChange={(event) => updateMin(Number(event.target.value))}
          onFocus={() => setFocusedHandle("min")}
          onBlur={() => setFocusedHandle(null)}
          className={cn("range-selector-input absolute inset-0 z-20 h-12 w-full", minValue >= max - step && "z-30")}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          aria-label={maxLabel}
          onChange={(event) => updateMax(Number(event.target.value))}
          onFocus={() => setFocusedHandle("max")}
          onBlur={() => setFocusedHandle(null)}
          className="range-selector-input absolute inset-0 z-20 h-12 w-full"
        />
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
