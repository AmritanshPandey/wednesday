// Single vocabulary for profile fields — shared by the setup forms,
// the seeded candidates, and the compatibility scoring so that string
// comparisons in the matching engine are always exact.

export const GENDERS = ["Male", "Female"] as const;

export const CITIES = ["Delhi NCR", "Mumbai", "Pune", "Bangalore"] as const;

export const RELIGIONS = [
  "Hindu",
  "Sikh",
  "Jain",
  "Christian",
  "Muslim",
  "Spiritual, not religious",
  "Prefer not to say"
] as const;

export const LANGUAGES = [
  "Hindi",
  "English",
  "Punjabi",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Tamil",
  "Telugu",
  "Kannada"
] as const;

export const WORK_STATUSES = [
  "Employed",
  "Self-employed",
  "Own business",
  "Between roles",
  "Studying",
  "Professional practice",
  "Freelance",
  "Family business",
  "Prefer not to say"
] as const;

export const WORK_LIVES = [
  "Mostly office-based",
  "Hybrid",
  "Shifts / irregular hours",
  "Frequent travel",
  "Mostly remote",
  "Flexible schedule"
] as const;

export const QUALIFICATIONS = ["Bachelor's", "Master's", "MBA", "PGDM", "PhD / Doctorate"] as const;

export const INTENTS = [
  "Relationship leading to marriage",
  "Marriage in the near future",
  "Intentional, but taking it naturally",
  "Still figuring it out"
] as const;

export const TIMELINES = ["Within a year", "1–2 years", "2–3 years", "Open to taking it naturally"] as const;

export const TAX_BRACKETS = [
  "0% bracket",
  "5% bracket",
  "10% bracket",
  "15% bracket",
  "20% bracket",
  "25% bracket",
  "30% bracket",
  "Prefer not to say"
] as const;

const LEGACY_INCOME_RANGE_TO_TAX_BRACKET: Record<string, (typeof TAX_BRACKETS)[number]> = {
  "Under ₹8L": "5% bracket",
  "₹8–15L": "10% bracket",
  "₹15–25L": "20% bracket",
  "₹25–40L": "30% bracket",
  "₹40L+": "30% bracket",
  "Prefer not to say": "Prefer not to say"
};

export function incomeRangeToTaxBracket(value: string): string {
  return LEGACY_INCOME_RANGE_TO_TAX_BRACKET[value] ?? value;
}

export const FINANCIAL_INDEPENDENCE = [
  "Financially independent",
  "Building toward independence",
  "Supported by family right now",
  "Prefer not to share"
] as const;

export const LIFESTYLE_EXPECTATIONS = [
  "Simple and practical",
  "Comfortable and balanced",
  "Premium experiences matter to me",
  "Still figuring this out"
] as const;

export const DRINKING = ["No", "Occasionally", "Socially", "Regularly", "Prefer not to say"] as const;

export const SMOKING = ["No", "Occasionally", "Regularly", "Prefer not to say"] as const;

export const FOODS = ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "No strong preference"] as const;

export const WEEKENDS = [
  "Quiet time at home",
  "A few close friends",
  "Exploring outside",
  "Family time",
  "A mix of everything"
] as const;

export const FITNESS = [
  "A regular part of my life",
  "A few times a week",
  "I'm trying to get there",
  "Not a focus right now"
] as const;

export const COMMUNICATION_STYLES = [
  "Talk it out right away",
  "Space first, then discuss",
  "Checking in often",
  "Quality conversations over frequency"
] as const;

export const CONFLICT_STYLES = [
  "Stay calm and talk",
  "Need a pause first",
  "Bring humour to soften it",
  "Direct and honest"
] as const;

export const PARTNER_SUPPORT = [
  "A calm presence",
  "Words of reassurance",
  "Practical help",
  "Time and patience"
] as const;

export const CHILDREN_VIEWS = ["Want children", "Open to children", "Don't want children", "Prefer to discuss later"] as const;

export const PARTNER_WITH_KIDS = ["Yes", "Open to discussion", "No"] as const;

export const LIVING_AFTER_MARRIAGE = [
  "Living with my family",
  "Close to family, own place",
  "Independent living",
  "Open to discussion"
] as const;

export const RELOCATION = [
  "Anywhere in India",
  "Within my region",
  "My city only",
  "Open to moving abroad"
] as const;

export const PRIORITIES = [
  "Building my career",
  "Getting married and building a family",
  "Personal growth",
  "Travel and new experiences",
  "Supporting my family",
  "Health and fitness",
  "Finding more stability"
] as const;

export const INTERESTS = [
  "Coffee",
  "Travel",
  "Cooking",
  "Reading",
  "Writing",
  "Photography",
  "Cricket",
  "Football",
  "Badminton",
  "Trekking",
  "Yoga",
  "Music",
  "Live gigs",
  "Cinema",
  "Standup comedy",
  "Art",
  "Dancing",
  "Board games",
  "Food exploring",
  "Volunteering",
  "Gardening",
  "Gaming"
] as const;

// ---- Partner preference option sets ----

export const PREF_CITY = ["My city only", "Open to nearby cities", "Anywhere in India"] as const;

export const PREF_RELIGION = ["No preference", "Same as mine"] as const;

export const PREF_TIMELINE = [
  "No preference",
  "Within a year",
  "Within 2 years",
  "Whenever it feels right"
] as const;

export const PREF_CHILDREN = [
  "No preference",
  "Wants or is open to children",
  "Doesn't want children"
] as const;

export const PREF_RELOCATION = ["No preference", "Open to relocating", "Wants to stay close to home"] as const;

export const PREF_FINANCE = [
  "No preference",
  "Financially independent",
  "Similar lifestyle expectations"
] as const;

export const PREF_SMOKING = ["Fine either way", "Prefer non-smoker", "Non-smoker only"] as const;

export const PREF_DRINKING = ["Fine either way", "Prefer rarely or never", "Non-drinker only"] as const;

export const PREF_FOOD = ["No preference", "Prefer vegetarian", "Vegetarian only"] as const;
