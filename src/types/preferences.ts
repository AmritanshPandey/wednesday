export const PREFERENCE_SECTIONS = [
  "age",
  "city",
  "religion",
  "timeline",
  "children",
  "relocation",
  "finance",
  "smoking",
  "drinking",
  "food"
] as const;

export type PreferenceSectionKey = (typeof PREFERENCE_SECTIONS)[number];

export type Preferences = {
  ageMin: number;
  ageMax: number;
  cityPref: string;
  religionPref: string;
  timelinePref: string;
  childrenPref: string;
  relocationPref: string;
  financePref: string;
  smokingPref: string;
  drinkingPref: string;
  foodPref: string;
  /** Sections the user marked as non-negotiable. */
  dealBreakers: Record<PreferenceSectionKey, boolean>;
};
