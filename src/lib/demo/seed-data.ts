import type { AllocationStats, MatchResult } from "@/types/match";
import type { Letter } from "@/types/letter";
import type { Preferences } from "@/types/preferences";
import type { PoolEntry, RankingRound } from "@/types/ranking";
import type { Profile } from "@/types/profile";
import { emptyDealBreakers } from "@/lib/matching/market";

export type DemoState = {
  /** The user's own profile — prefilled with demo defaults so the setup flow can be tapped through quickly. */
  profile: Profile;
  preferences: Preferences;
  /** Furthest setup step reached (1–11), for resuming. */
  setupStepReached: number;
  setupComplete: boolean;
  /** True once "join this week" has built the pool. */
  joinedWeek: boolean;
  pool: PoolEntry[];
  candidatesConsidered: number;
  passedDealBreakers: number;
  rounds: RankingRound[];
  /** Index into WEEK_DAYS. */
  dayIndex: number;
  match: MatchResult | null;
  stats: AllocationStats | null;
  letters: Letter[];
};

// ---------------------------------------------------------------------------
// Candidate seeds. Handcrafted fields carry the variety that matters to
// matching (intent, timeline, children, food, city, interests); the builder
// fills the long tail of profile fields deterministically by index.
// ---------------------------------------------------------------------------

type CandidateSeed = {
  name: string;
  age: number;
  city: string;
  religion?: string;
  role: string;
  industry: string;
  qualification?: string;
  food?: string;
  drinking?: string;
  smoking?: string;
  intent?: string;
  timeline?: string;
  children?: string;
  relocation?: string;
  interests: string[];
  story: string;
  photo: string;
  workLife?: string;
  taxBracket?: string;
  fitness?: string;
  communication?: string;
  priorities?: string[];
};

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

const COLLEGES: Record<string, string> = {
  "Delhi NCR": "Delhi University",
  Mumbai: "Mumbai University",
  Pune: "Symbiosis, Pune",
  Bangalore: "Christ University"
};

const LANGS: Record<string, string[]> = {
  "Delhi NCR": ["Hindi", "English", "Punjabi"],
  Mumbai: ["Hindi", "English", "Marathi"],
  Pune: ["Marathi", "Hindi", "English"],
  Bangalore: ["English", "Kannada", "Hindi"]
};

const SHOWS = ["The Office", "Fleabag", "Panchayat", "Modern Family", "Bandish Bandits", "Ted Lasso"];
const LISTENING = ["Prateek Kuhad", "old Kishore Kumar", "indie playlists", "AR Rahman", "lo-fi while working", "Coke Studio"];
const HOURS = ["food and where to eat next", "films and why endings matter", "people and what makes them tick", "travel plans I may never take", "design in everyday things", "cricket and its heartbreaks"];
const GOOD_REL = [
  "A calm place where both people can be fully honest.",
  "Two people rooting for each other, even on ordinary days.",
  "Feeling at home — laughter, honesty, and no scorekeeping.",
  "Steady, warm, and honest even when it's hard."
];
const WORKING_ON = [
  "Being more patient and less of a planner.",
  "Saying what I need instead of hinting.",
  "Better sleep and fewer screens at night.",
  "Making time for people, not just work."
];
const MOMENTS = [
  "Sunday morning chai, no phone, just the balcony.",
  "The trek where it rained the whole way up — worth it.",
  "Baked this for my parents' anniversary.",
  "My favourite corner of the city, 7 am.",
  "Post-gym coffee ritual with my best friend."
];
const WEEKEND_PICKS = [
  ["Quiet time at home", "A few close friends"],
  ["Exploring outside", "A mix of everything"],
  ["Family time", "Quiet time at home"],
  ["A few close friends", "Exploring outside"],
  ["A mix of everything"]
];
const CONFLICTS = ["Stay calm and talk", "Need a pause first", "Direct and honest", "Bring humour to soften it"];
const SUPPORTS = ["A calm presence", "Words of reassurance", "Time and patience", "Practical help"];
const LIVING = ["Close to family, own place", "Independent living", "Open to discussion", "Close to family, own place"];

function candidate(index: number, seed: CandidateSeed): Profile {
  const city = seed.city;
  return {
    id: `cand-${seed.name.toLowerCase()}-${index}`,
    name: seed.name,
    age: seed.age,
    gender: "Female",
    city,
    religion: seed.religion ?? "Hindu",
    languages: LANGS[city] ?? ["Hindi", "English"],
    workStatus: "Employed",
    role: seed.role,
    industry: seed.industry,
    workLife: seed.workLife ?? ["Hybrid", "Mostly office-based", "Flexible schedule", "Mostly remote"][index % 4],
    qualification: seed.qualification ?? ["Master's", "Bachelor's", "MBA", "Bachelor's"][index % 4],
    college: COLLEGES[city] ?? "Delhi University",
    intent: seed.intent ?? "Relationship leading to marriage",
    timeline: seed.timeline ?? ["Within a year", "1–2 years"][index % 2],
    taxBracket: seed.taxBracket ?? ["10% bracket", "20% bracket", "30% bracket"][index % 3],
    financialIndependence: "Financially independent",
    lifestyleExpectation: ["Comfortable and balanced", "Simple and practical", "Comfortable and balanced"][index % 3],
    drinking: seed.drinking ?? ["Occasionally", "No", "Socially"][index % 3],
    smoking: seed.smoking ?? "No",
    food: seed.food ?? ["Vegetarian", "Non-vegetarian", "Eggetarian"][index % 3],
    weekend: WEEKEND_PICKS[index % WEEKEND_PICKS.length],
    fitness: seed.fitness ?? ["A few times a week", "A regular part of my life", "I'm trying to get there"][index % 3],
    communication: seed.communication ?? ["Talk it out right away", "Quality conversations over frequency", "Checking in often"][index % 3],
    conflict: CONFLICTS[index % CONFLICTS.length],
    partnerSupport: SUPPORTS[index % SUPPORTS.length],
    goodRelationship: GOOD_REL[index % GOOD_REL.length],
    workingOn: WORKING_ON[index % WORKING_ON.length],
    children: seed.children ?? ["Want children", "Open to children"][index % 2],
    partnerWithKids: "Open to discussion",
    livingAfterMarriage: LIVING[index % LIVING.length],
    relocation: seed.relocation ?? ["Within my region", "Anywhere in India", "My city only"][index % 3],
    priorities: seed.priorities ?? [
      ["Getting married and building a family", "Building my career"],
      ["Building my career", "Personal growth"],
      ["Getting married and building a family", "Finding more stability"],
      ["Personal growth", "Travel and new experiences"]
    ][index % 4],
    interests: seed.interests,
    favouriteShow: SHOWS[index % SHOWS.length],
    listeningTo: LISTENING[index % LISTENING.length],
    talkForHours: HOURS[index % HOURS.length],
    story: seed.story,
    moments: [{ title: ["A quiet ritual", "A favourite escape", "My kind of weekend"][index % 3], caption: MOMENTS[index % MOMENTS.length] }],
    photoUrl: unsplash(seed.photo)
  };
}

const SEEDS: CandidateSeed[] = [
  { name: "Ananya", age: 27, city: "Delhi NCR", role: "Product Designer", industry: "IT & Tech", food: "Vegetarian", interests: ["Coffee", "Travel", "Cinema", "Reading", "Food exploring"], story: "Sunday mornings, coffee walks, and conversations that linger.", photo: "photo-1508214751196-bcfd4ca60f91", timeline: "Within a year", children: "Want children" },
  { name: "Riya", age: 29, city: "Delhi NCR", role: "Marketing Manager", industry: "FMCG", food: "Non-vegetarian", interests: ["Standup comedy", "Coffee", "Travel", "Music"], story: "Enjoys meaningful conversations and good humour in equal measure.", photo: "photo-1494790108377-be9c29b29330", timeline: "1–2 years" },
  { name: "Mehak", age: 27, city: "Delhi NCR", role: "Architect", industry: "Design", food: "Vegetarian", interests: ["Art", "Photography", "Travel", "Coffee"], story: "Appreciates family, traditions, and well-lit rooms.", photo: "photo-1524504388940-b1c1722653e1", children: "Want children", timeline: "Within a year" },
  { name: "Kritika", age: 28, city: "Mumbai", role: "Product Manager", industry: "Fintech", food: "Non-vegetarian", interests: ["Travel", "Trekking", "Food exploring", "Cinema"], story: "Loves travel and discovering new places, planning optional.", photo: "photo-1517841905240-472988babdf9", relocation: "Anywhere in India" },
  { name: "Megha", age: 25, city: "Mumbai", role: "UX Researcher", industry: "IT & Tech", food: "Eggetarian", interests: ["Reading", "Writing", "Coffee", "Board games"], story: "Collects small rituals: handwritten notes and Sunday markets.", photo: "photo-1544005313-94ddf0286df2", timeline: "1–2 years" },
  { name: "Rhea", age: 26, city: "Bangalore", role: "Product Designer", industry: "IT & Tech", food: "Vegetarian", interests: ["Coffee", "Travel", "Music", "Cinema"], story: "Thoughtful, curious, and serious about building something real.", photo: "photo-1529626455594-4ff0802cfb7e", children: "Want children", timeline: "Within a year", relocation: "Anywhere in India" },
  { name: "Maya", age: 28, city: "Mumbai", role: "Editorial Strategist", industry: "Media", food: "Non-vegetarian", interests: ["Reading", "Art", "Coffee", "Cooking"], story: "Long dinners where phones disappear from the table.", photo: "photo-1438761681033-6461ffad8d80", timeline: "1–2 years" },
  { name: "Neha", age: 30, city: "Bangalore", role: "Music Therapist", industry: "Healthcare", food: "Vegetarian", interests: ["Music", "Yoga", "Reading", "Volunteering"], story: "Believes steadiness is romantic.", photo: "photo-1502823403499-6ccfcf4fb453", timeline: "1–2 years", children: "Open to children" },
  { name: "Ishita", age: 26, city: "Delhi NCR", role: "Chartered Accountant", industry: "Finance", food: "Vegetarian", interests: ["Cooking", "Board games", "Cinema", "Badminton"], story: "Numbers by day, gharwala khaana by night.", photo: "photo-1521146764736-56c929d59c83", children: "Want children", timeline: "Within a year" },
  { name: "Sanya", age: 29, city: "Delhi NCR", role: "Corporate Lawyer", industry: "Legal", food: "Non-vegetarian", drinking: "Socially", interests: ["Travel", "Standup comedy", "Food exploring", "Music"], story: "Sharp in court, soft about golden retrievers.", photo: "photo-1554151228-14d9def656e4", timeline: "1–2 years" },
  { name: "Aditi", age: 27, city: "Pune", role: "Data Scientist", industry: "IT & Tech", food: "Vegetarian", interests: ["Trekking", "Reading", "Coffee", "Gaming"], story: "Weekday models, weekend mountains.", photo: "photo-1487412720507-e7ab37603c6f", relocation: "Anywhere in India", timeline: "Within a year" },
  { name: "Tara", age: 28, city: "Bangalore", role: "Founder", industry: "D2C", food: "Eggetarian", interests: ["Coffee", "Travel", "Art", "Food exploring"], story: "Building a small brand with big feelings.", photo: "photo-1534528741775-53994a69daeb", timeline: "1–2 years", children: "Open to children" },
  { name: "Nandini", age: 26, city: "Delhi NCR", role: "Doctor", industry: "Healthcare", food: "Vegetarian", interests: ["Reading", "Cooking", "Yoga", "Music"], story: "Night shifts taught me to value slow mornings.", photo: "photo-1506863530036-1efeddceb993", children: "Want children", timeline: "Within a year", workLife: "Shifts / irregular hours" },
  { name: "Shreya", age: 27, city: "Mumbai", role: "Financial Analyst", industry: "Banking", food: "Non-vegetarian", interests: ["Cinema", "Coffee", "Travel", "Dancing"], story: "Spreadsheet by profession, spontaneous by nature.", photo: "photo-1548142813-c348350df52b", timeline: "Within a year" },
  { name: "Pooja", age: 30, city: "Pune", role: "Professor", industry: "Education", food: "Vegetarian", interests: ["Reading", "Writing", "Gardening", "Music"], story: "Teaches literature, lives it on weekends.", photo: "photo-1519742866993-66d3cfef4bbd", timeline: "1–2 years", children: "Open to children" },
  { name: "Kavya", age: 25, city: "Bangalore", role: "Software Engineer", industry: "IT & Tech", food: "Non-vegetarian", interests: ["Gaming", "Cricket", "Cinema", "Food exploring"], story: "Debugs code and over-plans trips.", photo: "photo-1488426862026-3ee34a7d66df", timeline: "1–2 years", relocation: "Anywhere in India" },
  { name: "Anjali", age: 28, city: "Delhi NCR", role: "HR Lead", industry: "Consulting", food: "Vegetarian", interests: ["Yoga", "Cooking", "Travel", "Volunteering"], story: "People person, on and off the clock.", photo: "photo-1526510747491-58f928ec870f", children: "Want children", timeline: "Within a year" },
  { name: "Diya", age: 26, city: "Mumbai", role: "Interior Designer", industry: "Design", food: "Eggetarian", interests: ["Art", "Photography", "Coffee", "Cinema"], story: "Rearranges furniture when thinking.", photo: "photo-1524638431109-93d95c968f03", timeline: "Within a year" },
  { name: "Simran", age: 29, city: "Delhi NCR", religion: "Sikh", role: "Consultant", industry: "Consulting", food: "Non-vegetarian", interests: ["Travel", "Music", "Food exploring", "Badminton"], story: "Frequent flyer trying to stay grounded.", photo: "photo-1516726817505-f5ed825624d8", timeline: "1–2 years", workLife: "Frequent travel" },
  { name: "Naina", age: 27, city: "Pune", role: "Psychologist", industry: "Healthcare", food: "Vegetarian", interests: ["Reading", "Yoga", "Writing", "Coffee"], story: "Good listener, better question-asker.", photo: "photo-1531746020798-e6953c6e8e04", children: "Open to children", timeline: "Within a year" },
  { name: "Aarushi", age: 25, city: "Delhi NCR", role: "Journalist", industry: "Media", food: "Non-vegetarian", interests: ["Writing", "Cinema", "Standup comedy", "Coffee"], story: "Chases stories, keeps receipts.", photo: "photo-1557053910-d9eadeed1c58", timeline: "1–2 years" },
  { name: "Vaani", age: 28, city: "Bangalore", role: "Dentist", industry: "Healthcare", food: "Vegetarian", interests: ["Cooking", "Music", "Travel", "Board games"], story: "Makes people smile, professionally.", photo: "photo-1509967419530-da38b4704bc6", children: "Want children", timeline: "Within a year" },
  { name: "Mitali", age: 30, city: "Mumbai", role: "Brand Manager", industry: "FMCG", food: "Eggetarian", interests: ["Travel", "Food exploring", "Dancing", "Cinema"], story: "Knows the second-best restaurant in every neighbourhood.", photo: "photo-1499155286265-79a9dc9c6380", timeline: "1–2 years" },
  { name: "Zoya", age: 27, city: "Delhi NCR", religion: "Muslim", role: "Fashion Designer", industry: "Fashion", food: "Non-vegetarian", interests: ["Art", "Photography", "Music", "Coffee"], story: "Sews her own clothes, quotes her own nani.", photo: "photo-1512310604669-443f26c35f52", timeline: "1–2 years" },
  { name: "Prerna", age: 26, city: "Pune", role: "Product Analyst", industry: "IT & Tech", food: "Vegetarian", interests: ["Trekking", "Coffee", "Reading", "Cricket"], story: "Sunrise treks over late nights.", photo: "photo-1520813792240-56fc4a3765a7", children: "Want children", timeline: "Within a year", relocation: "Within my region" },
  { name: "Sakshi", age: 28, city: "Delhi NCR", role: "Event Planner", industry: "Hospitality", food: "Vegetarian", interests: ["Dancing", "Music", "Food exploring", "Travel"], story: "Plans weddings; unbothered by chaos.", photo: "photo-1543096222-72de739f7917", timeline: "Within a year" },
  { name: "Devika", age: 31, city: "Bangalore", role: "Research Scientist", industry: "Biotech", food: "Vegetarian", interests: ["Reading", "Gardening", "Yoga", "Board games"], story: "Curious about everything, hurried about nothing.", photo: "photo-1546961329-78bef0414d7c", timeline: "1–2 years", children: "Open to children" },
  { name: "Ira", age: 27, city: "Mumbai", role: "Animator", industry: "Media", food: "Eggetarian", interests: ["Art", "Cinema", "Gaming", "Coffee"], story: "Draws feelings better than she says them.", photo: "photo-1567532939604-b6b5b0db2604", timeline: "Within a year" },
  // Deliberate edge cases: filtered out by the default demo preferences.
  { name: "Avni", age: 33, city: "Mumbai", role: "Creative Director", industry: "Advertising", food: "Non-vegetarian", interests: ["Art", "Travel", "Music"], story: "Her own timeline, her own rules.", photo: "photo-1541823709867-1b206113eafd", timeline: "Open to taking it naturally", intent: "Still figuring it out" },
  { name: "Nisha", age: 29, city: "Bangalore", role: "Travel Blogger", industry: "Media", food: "Non-vegetarian", drinking: "Regularly", smoking: "Occasionally", interests: ["Travel", "Photography", "Trekking"], story: "Home is wherever the next flight goes.", photo: "photo-1531123897727-8f129e1688ce", timeline: "2–3 years", children: "Don't want children", relocation: "Open to moving abroad", intent: "Intentional, but taking it naturally" }
];

export const CANDIDATES: Profile[] = SEEDS.map((seed, index) => candidate(index, seed));

// ---------------------------------------------------------------------------
// The demo persona (mirrors the hi-fi mocks) — used to prefill setup.
// ---------------------------------------------------------------------------

export const ARJUN: Profile = {
  id: "user-arjun",
  name: "Arjun",
  dateOfBirth: "1998-07-05",
  age: 28,
  gender: "Male",
  city: "Delhi NCR",
  religion: "Hindu",
  languages: ["Hindi", "English"],
  workStatus: "Employed",
  role: "Senior Product Designer",
  industry: "IT & Tech",
  workLife: "Mostly office-based",
  qualification: "Bachelor's",
  college: "Delhi University",
  intent: "Relationship leading to marriage",
  timeline: "Within a year",
  taxBracket: "20% bracket",
  financialIndependence: "Financially independent",
  lifestyleExpectation: "Comfortable and balanced",
  drinking: "Occasionally",
  smoking: "No",
  food: "Non-vegetarian",
  weekend: ["A few close friends", "Exploring outside"],
  fitness: "A few times a week",
  communication: "Talk it out right away",
  conflict: "Stay calm and talk",
  partnerSupport: "A calm presence",
  goodRelationship: "A calm place where both people can be fully honest — and laugh a lot on the way.",
  workingOn: "Being more present; fewer screens after 9 pm.",
  children: "Want children",
  partnerWithKids: "Open to discussion",
  livingAfterMarriage: "Close to family, own place",
  relocation: "Within my region",
  priorities: ["Getting married and building a family", "Building my career"],
  interests: ["Coffee", "Travel", "Cinema", "Cricket", "Food exploring", "Reading"],
  favouriteShow: "The Office",
  listeningTo: "Prateek Kuhad, mostly on loop",
  talkForHours: "Design in everyday things",
  story: "I like building thoughtful products, unhurried weekends, and conversations that go somewhere.",
  moments: [
    { title: "Morning ritual", caption: "Morning chai at the barsati — best hour of the day." },
    { title: "A trip I still talk about", caption: "The Landour trip that turned into three extra days." },
    { title: "My kitchen experiment", caption: "First attempt at dal makhani. Family survived." }
  ],
  photoUrl: unsplash("photo-1543084951-1650d1468e2d")
};

export const DEFAULT_PREFERENCES: Preferences = {
  ageMin: 24,
  ageMax: 31,
  cityPref: "Open to nearby cities",
  religionPref: "Same as mine",
  timelinePref: "Within 2 years",
  childrenPref: "Wants or is open to children",
  relocationPref: "No preference",
  financePref: "No preference",
  smokingPref: "Prefer non-smoker",
  drinkingPref: "Fine either way",
  foodPref: "No preference",
  dealBreakers: { ...emptyDealBreakers(), age: true, timeline: true, children: true }
};

export const seedDemoState: DemoState = {
  profile: structuredClone(ARJUN),
  preferences: structuredClone(DEFAULT_PREFERENCES),
  setupStepReached: 1,
  setupComplete: false,
  joinedWeek: false,
  pool: [],
  candidatesConsidered: 0,
  passedDealBreakers: 0,
  rounds: [],
  dayIndex: 0,
  match: null,
  stats: null,
  letters: []
};
