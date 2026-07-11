export type RankingRound = {
  /** 1–5 are pool rounds; the final round re-ranks the winners of each pool round. */
  round: number;
  isFinal: boolean;
  profileIds: string[];
  /** Current order, best first. Equals profileIds until the user drags. */
  rankedOrder: string[];
  submitted: boolean;
};

export type PoolEntry = {
  profileId: string;
  compatibility: number;
  breakdown: CategoryScore[];
  /** Denormalized postcard of the candidate (live mode: candidates are real users). */
  profile?: import("@/types/profile").Profile;
};

export type CategoryScore = {
  key: string;
  label: string;
  /** 0–1 similarity within the category. */
  score: number;
  /** Contribution weight out of 100. */
  weight: number;
};
