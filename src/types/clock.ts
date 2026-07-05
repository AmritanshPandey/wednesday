export type SimDay = {
  label: string;
  short: string;
  date: string;
};

/** One simulated Wednesday cycle: rank Thu–Tue, reveal Wed, move by Thu. */
export const WEEK_DAYS: SimDay[] = [
  { label: "Thursday", short: "Thu", date: "2 Jul" },
  { label: "Friday", short: "Fri", date: "3 Jul" },
  { label: "Saturday", short: "Sat", date: "4 Jul" },
  { label: "Sunday", short: "Sun", date: "5 Jul" },
  { label: "Monday", short: "Mon", date: "6 Jul" },
  { label: "Tuesday", short: "Tue", date: "7 Jul" },
  { label: "Wednesday", short: "Wed", date: "8 Jul" },
  { label: "Thursday", short: "Thu", date: "9 Jul" },
  { label: "Friday", short: "Fri", date: "10 Jul" }
];

export const REVEAL_DAY = 6;
export const DEADLINE_DAY = 7;
