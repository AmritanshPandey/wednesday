"use client";

import * as React from "react";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";

/** Suggestions stay hidden until the query is specific enough to be useful. */
const MIN_QUERY_LENGTH = 3;
const MAX_SUGGESTIONS = 8;

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Prefix matches first, then substring matches — both alphabetical within
 *  their group, so "eng" offers "Engineering Manager" before "Sales Engineer". */
function rankMatches(options: readonly string[], query: string) {
  const q = normalize(query);
  const prefix: string[] = [];
  const contains: string[] = [];

  for (const option of options) {
    const candidate = normalize(option);
    if (candidate.startsWith(q)) prefix.push(option);
    else if (candidate.includes(q)) contains.push(option);
  }

  return [...prefix, ...contains].slice(0, MAX_SUGGESTIONS);
}

/**
 * A free-text field that suggests from a known list once you've typed enough
 * to narrow it down. Anything you type is kept whether or not it's on the
 * list — these fields describe real jobs, and no list covers every one.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  minQueryLength = MIN_QUERY_LENGTH,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  minQueryLength?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  const matches = React.useMemo(() => {
    if (normalize(value).length < minQueryLength) return [];
    const ranked = rankMatches(options, value);
    // Nothing to offer once the text already is the option.
    if (ranked.length === 1 && normalize(ranked[0]) === normalize(value)) return [];
    return ranked;
  }, [options, value, minQueryLength]);

  const showList = open && matches.length > 0;
  // Matches shrink as the query narrows, so never point past the end.
  const activeOption = Math.min(activeIndex, matches.length - 1);

  React.useEffect(() => {
    if (!showList) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showList]);

  const commit = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input
        // text-base (16px): anything smaller makes iOS Safari zoom in on focus.
        className="h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listboxId : undefined}
        aria-activedescendant={showList ? `${listboxId}-${activeOption}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (!showList) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((activeOption + 1) % matches.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((activeOption - 1 + matches.length) % matches.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            commit(matches[activeOption]);
          }
        }}
      />

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-60 overflow-y-auto rounded-[14px] border border-border bg-card p-1.5 shadow-postcard"
        >
          {matches.map((option, index) => {
            const selected = normalize(option) === normalize(value);
            return (
              <li key={option}>
                <button
                  id={`${listboxId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  // Keep focus in the input so the list doesn't close before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-2 rounded-[10px] px-3 text-left text-sm font-bold transition",
                    index === activeOption ? "bg-secondary text-foreground" : "text-foreground",
                    selected && "bg-primary text-primary-foreground"
                  )}
                >
                  <span className="min-w-0 truncate">{option}</span>
                  {selected ? <IconCheck className="h-4 w-4 shrink-0" stroke={2.5} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
