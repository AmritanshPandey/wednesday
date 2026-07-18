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
  "Bengali",
  "Marathi",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Urdu",
  "Kannada",
  "Odia",
  "Malayalam",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Bhojpuri",
  "Santali",
  "Kashmiri",
  "Nepali",
  "Sindhi",
  "Konkani",
  "Dogri",
  "Manipuri",
  "Bodo",
  "Tulu"
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

/** Suggestions for the free-text role field — broad enough to cover most
 *  members, never a closed list. Anything typed is kept as-is. */
export const ROLES = [
  // Software & data
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Engineer",
  "Principal Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
  "Android Engineer",
  "iOS Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Architect",
  "Solutions Architect",
  "QA Engineer",
  "Test Automation Engineer",
  "Embedded Engineer",
  "Security Engineer",
  "Engineering Manager",
  "Director of Engineering",
  "VP of Engineering",
  "Chief Technology Officer",
  "Data Analyst",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Research Scientist",
  "Business Intelligence Analyst",
  "Database Administrator",
  "Systems Administrator",
  "Network Engineer",
  "IT Support Engineer",
  // Product & design
  "Product Manager",
  "Senior Product Manager",
  "Group Product Manager",
  "Director of Product",
  "Chief Product Officer",
  "Product Owner",
  "Technical Program Manager",
  "Project Manager",
  "Program Manager",
  "Scrum Master",
  "Business Analyst",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  "Graphic Designer",
  "Visual Designer",
  "Motion Designer",
  "Industrial Designer",
  "Interior Designer",
  "Fashion Designer",
  "Design Manager",
  "Creative Director",
  "Art Director",
  "Illustrator",
  "Animator",
  "Photographer",
  "Videographer",
  "Video Editor",
  // Business, finance & consulting
  "Founder",
  "Co-founder",
  "Chief Executive Officer",
  "Chief Operating Officer",
  "Chief Financial Officer",
  "Management Consultant",
  "Strategy Consultant",
  "Business Consultant",
  "Analyst",
  "Associate",
  "Investment Banker",
  "Equity Research Analyst",
  "Financial Analyst",
  "Investment Analyst",
  "Portfolio Manager",
  "Venture Capital Associate",
  "Private Equity Associate",
  "Chartered Accountant",
  "Accountant",
  "Auditor",
  "Tax Consultant",
  "Company Secretary",
  "Actuary",
  "Risk Analyst",
  "Compliance Officer",
  "Operations Manager",
  "Supply Chain Manager",
  "Logistics Manager",
  "Procurement Manager",
  "General Manager",
  "Business Development Manager",
  "Sales Manager",
  "Account Manager",
  "Account Executive",
  "Sales Engineer",
  "Customer Success Manager",
  "Marketing Manager",
  "Digital Marketing Manager",
  "Brand Manager",
  "Growth Manager",
  "Performance Marketing Manager",
  "Content Strategist",
  "Content Writer",
  "Copywriter",
  "Social Media Manager",
  "Public Relations Manager",
  "Communications Manager",
  "Human Resources Manager",
  "Talent Acquisition Specialist",
  "Recruiter",
  "Learning and Development Manager",
  // Medicine & healthcare
  "Doctor",
  "Physician",
  "Surgeon",
  "Dentist",
  "Paediatrician",
  "Cardiologist",
  "Dermatologist",
  "Radiologist",
  "Anaesthesiologist",
  "Psychiatrist",
  "Ophthalmologist",
  "Orthopaedic Surgeon",
  "Gynaecologist",
  "General Practitioner",
  "Medical Officer",
  "Resident Doctor",
  "Veterinarian",
  "Pharmacist",
  "Physiotherapist",
  "Nutritionist",
  "Dietitian",
  "Nurse",
  "Clinical Psychologist",
  "Therapist",
  "Counsellor",
  "Medical Researcher",
  // Law & public service
  "Lawyer",
  "Advocate",
  "Corporate Lawyer",
  "Litigation Lawyer",
  "Legal Counsel",
  "Legal Associate",
  "Judge",
  "Civil Servant",
  "IAS Officer",
  "IPS Officer",
  "IFS Officer",
  "Policy Analyst",
  "Defence Officer",
  "Army Officer",
  "Navy Officer",
  "Air Force Officer",
  "Police Officer",
  // Education & academia
  "Teacher",
  "Professor",
  "Assistant Professor",
  "Associate Professor",
  "Lecturer",
  "Principal",
  "Academic Researcher",
  "PhD Scholar",
  "Research Associate",
  "Education Consultant",
  // Engineering & sciences
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Electronics Engineer",
  "Chemical Engineer",
  "Aerospace Engineer",
  "Automotive Engineer",
  "Biomedical Engineer",
  "Environmental Engineer",
  "Structural Engineer",
  "Architect",
  "Urban Planner",
  "Quantity Surveyor",
  "Scientist",
  "Biotechnologist",
  "Geologist",
  "Agronomist",
  // Media, arts & other
  "Journalist",
  "Editor",
  "Author",
  "Screenwriter",
  "Filmmaker",
  "Producer",
  "Musician",
  "Chef",
  "Pilot",
  "Cabin Crew",
  "Merchant Navy Officer",
  "Hotel Manager",
  "Event Manager",
  "Travel Consultant",
  "Fitness Trainer",
  "Sports Coach",
  "Athlete",
  "Social Worker",
  "Development Sector Professional",
  "Entrepreneur",
  "Freelancer",
  "Student"
] as const;

/** Suggestions for the free-text industry field. */
export const INDUSTRIES = [
  "Information Technology",
  "Software Products",
  "IT Services",
  "Software as a Service",
  "Internet & Consumer Tech",
  "E-commerce",
  "Fintech",
  "Edtech",
  "Healthtech",
  "Agritech",
  "Deeptech",
  "Artificial Intelligence",
  "Cybersecurity",
  "Cloud Computing",
  "Telecommunications",
  "Semiconductors",
  "Electronics",
  "Hardware",
  "Gaming",
  "Banking",
  "Investment Banking",
  "Financial Services",
  "Insurance",
  "Venture Capital",
  "Private Equity",
  "Asset Management",
  "Accounting",
  "Audit & Assurance",
  "Taxation",
  "Management Consulting",
  "Strategy Consulting",
  "Legal Services",
  "Human Resources",
  "Staffing & Recruitment",
  "Advertising",
  "Marketing",
  "Public Relations",
  "Market Research",
  "Media & Entertainment",
  "Film & Television",
  "Music",
  "Publishing",
  "Journalism",
  "Design",
  "Architecture",
  "Real Estate",
  "Construction",
  "Infrastructure",
  "Civil Engineering",
  "Manufacturing",
  "Automotive",
  "Aerospace",
  "Defence",
  "Aviation",
  "Shipping & Maritime",
  "Logistics",
  "Supply Chain",
  "Transportation",
  "Energy",
  "Oil & Gas",
  "Renewable Energy",
  "Power & Utilities",
  "Mining & Metals",
  "Chemicals",
  "Pharmaceuticals",
  "Biotechnology",
  "Life Sciences",
  "Medical Devices",
  "Healthcare",
  "Hospitals & Clinics",
  "Mental Health",
  "Fitness & Wellness",
  "Education",
  "Higher Education",
  "Research & Academia",
  "Government",
  "Public Policy",
  "Civil Services",
  "Armed Forces",
  "Non-profit",
  "Social Impact",
  "International Development",
  "Consumer Goods",
  "Retail",
  "Fashion & Apparel",
  "Beauty & Personal Care",
  "Luxury Goods",
  "Food & Beverage",
  "Restaurants",
  "Hospitality",
  "Travel & Tourism",
  "Agriculture",
  "Textiles",
  "Sports",
  "Events",
  "Photography",
  "Art & Culture",
  "Environment & Sustainability"
] as const;

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

export const CANNABIS = ["No", "Occasionally", "Regularly", "Prefer not to say"] as const;

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

export const PREF_CANNABIS = ["Fine either way", "Prefer non-user", "Non-user only"] as const;

export const PREF_DRINKING = ["Fine either way", "Prefer rarely or never", "Non-drinker only"] as const;

export const PREF_FOOD = ["No preference", "Prefer vegetarian", "Vegetarian only"] as const;
