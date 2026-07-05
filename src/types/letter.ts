export type Letter = {
  id: string;
  author: "user" | "match";
  body: string;
  /** Day index (into WEEK_DAYS) the letter arrived. */
  dayIndex: number;
};
