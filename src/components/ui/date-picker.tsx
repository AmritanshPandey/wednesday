"use client";

import * as React from "react";
import { IconCalendar, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

type DatePickerProps = {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

type DatePart = "month" | "day" | "year";

type DateDropdownOption = {
  value: number;
  label: string;
  disabled?: boolean;
};

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseIsoDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isBeforeDay(a: Date, b: Date) {
  return a.getTime() < b.getTime();
}

function isAfterDay(a: Date, b: Date) {
  return a.getTime() > b.getTime();
}

function isOutsideRange(date: Date, minDate: Date | null, maxDate: Date | null) {
  return Boolean((minDate && isBeforeDay(date, minDate)) || (maxDate && isAfterDay(date, maxDate)));
}

function isMonthOutsideRange(year: number, month: number, minDate: Date | null, maxDate: Date | null) {
  return Boolean(
    (minDate && isBeforeDay(endOfMonth(new Date(year, month, 1)), minDate)) ||
      (maxDate && isAfterDay(startOfMonth(new Date(year, month, 1)), maxDate))
  );
}

function daysInMonth(year: number, month: number) {
  return endOfMonth(new Date(year, month, 1)).getDate();
}

function buildDate(year: number, month: number, day: number) {
  return new Date(year, month, Math.min(day, daysInMonth(year, month)));
}

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function clampDate(date: Date, minDate: Date | null, maxDate: Date | null) {
  const normalized = cloneDate(date);

  if (minDate && isBeforeDay(normalized, minDate)) return cloneDate(minDate);
  if (maxDate && isAfterDay(normalized, maxDate)) return cloneDate(maxDate);
  return normalized;
}

function formatDisplayDate(date: Date | null) {
  if (!date) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function DatePartDropdown({
  label,
  value,
  selectedLabel,
  options,
  open,
  onOpenChange,
  onChange,
  className
}: {
  label: string;
  value: number;
  selectedLabel: string;
  options: DateDropdownOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: number) => void;
  className?: string;
}) {
  const labelId = React.useId();

  return (
    <div className={cn("relative min-w-0", className)}>
      <span id={labelId} className="mb-1.5 block px-1 text-[11px] font-extrabold uppercase text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-full border border-gold bg-card px-3 text-left text-base font-extrabold text-foreground shadow-sm transition hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <IconChevronDown
          className={cn("ml-auto h-4 w-4 shrink-0 text-primary transition", open && "rotate-180")}
          stroke={2.4}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-60 overflow-y-auto rounded-[14px] border border-border bg-card p-1.5 shadow-postcard"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex h-10 w-full items-center justify-between gap-2 rounded-[10px] px-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary",
                  option.disabled && "pointer-events-none text-muted-foreground/35"
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected ? <IconCheck className="h-4 w-4 shrink-0" stroke={2.5} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DatePicker({
  value,
  min,
  max,
  onChange,
  placeholder = "Select a date",
  className
}: DatePickerProps) {
  const selectedDate = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const [open, setOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<DatePart | null>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const [draftDate, setDraftDate] = React.useState(() =>
    clampDate(selectedDate ?? maxDate ?? new Date(), minDate, maxDate)
  );

  const draftYear = draftDate.getFullYear();
  const draftMonth = draftDate.getMonth();
  const draftDay = draftDate.getDate();
  const yearMin = minDate?.getFullYear() ?? draftYear - 100;
  const yearMax = maxDate?.getFullYear() ?? draftYear + 20;
  const years = Array.from({ length: yearMax - yearMin + 1 }, (_, index) => yearMax - index);
  const monthOptions = MONTHS.map((month, index) => ({
    value: index,
    label: month,
    disabled: isMonthOutsideRange(draftYear, index, minDate, maxDate)
  }));
  const dayOptions = Array.from({ length: daysInMonth(draftYear, draftMonth) }, (_, index) => {
    const day = index + 1;

    return {
      value: day,
      label: String(day),
      disabled: isOutsideRange(new Date(draftYear, draftMonth, day), minDate, maxDate)
    };
  });
  const yearOptions = years.map((year) => ({ value: year, label: String(year) }));

  const commitDate = (date: Date) => {
    const clampedDate = clampDate(date, minDate, maxDate);

    setDraftDate(clampedDate);
    onChange(toIsoDate(clampedDate));
  };

  const updateMonth = (month: number) => {
    commitDate(buildDate(draftYear, month, draftDay));
  };

  const updateDay = (day: number) => {
    commitDate(new Date(draftYear, draftMonth, day));
  };

  const updateYear = (year: number) => {
    commitDate(buildDate(year, draftMonth, draftDay));
  };

  const togglePicker = () => {
    if (!open) {
      setDraftDate(clampDate(selectedDate ?? maxDate ?? new Date(), minDate, maxDate));
    }

    setActiveDropdown(null);
    setOpen((value) => !value);
  };

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div
      ref={pickerRef}
      className={cn("relative w-full", className)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          setActiveDropdown(null);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={togglePicker}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-[16px] border border-gold bg-card px-4 text-left text-sm font-bold shadow-sm transition hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("min-w-0 truncate", selectedDate ? "text-foreground" : "text-muted-foreground")}>
          {formatDisplayDate(selectedDate) || placeholder}
        </span>
        <IconCalendar className="h-5 w-5 shrink-0 text-primary" stroke={1.9} />
      </button>

      {open ? (
        <div className="mt-3 rounded-[18px] border border-border bg-card p-3 shadow-postcard">
          <div className="grid grid-cols-[1.35fr_0.72fr_0.9fr] gap-2">
            <DatePartDropdown
              label="Month"
              value={draftMonth}
              selectedLabel={MONTHS[draftMonth]}
              options={monthOptions}
              open={activeDropdown === "month"}
              onOpenChange={(nextOpen) => setActiveDropdown(nextOpen ? "month" : null)}
              onChange={updateMonth}
            />
            <DatePartDropdown
              label="Day"
              value={draftDay}
              selectedLabel={String(draftDay)}
              options={dayOptions}
              open={activeDropdown === "day"}
              onOpenChange={(nextOpen) => setActiveDropdown(nextOpen ? "day" : null)}
              onChange={updateDay}
            />
            <DatePartDropdown
              label="Year"
              value={draftYear}
              selectedLabel={String(draftYear)}
              options={yearOptions}
              open={activeDropdown === "year"}
              onOpenChange={(nextOpen) => setActiveDropdown(nextOpen ? "year" : null)}
              onChange={updateYear}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-secondary/45 px-3 py-2">
            <span className="min-w-0 truncate text-sm font-bold text-foreground">{formatDisplayDate(draftDate)}</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setActiveDropdown(null);
              }}
              className="h-9 shrink-0 rounded-full bg-primary px-4 text-sm font-extrabold text-primary-foreground transition hover:bg-primary/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
