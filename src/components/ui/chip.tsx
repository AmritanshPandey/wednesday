"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function Chip({ selected, className, type, ...props }: ChipProps) {
  return (
    <button
      type={type ?? "button"}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-[background-color,transform,border-color,box-shadow] duration-200 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-gold bg-card text-foreground hover:bg-secondary",
        className
      )}
      {...props}
    />
  );
}

export function ChipSelect({
  options,
  value,
  onChange,
  className
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {options.map((option) => (
        <Chip key={option} selected={value === option} onClick={() => onChange(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
}

export function ChipMultiSelect({
  options,
  values,
  onToggle,
  className
}: {
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {options.map((option) => (
        <Chip key={option} selected={values.includes(option)} onClick={() => onToggle(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
}
