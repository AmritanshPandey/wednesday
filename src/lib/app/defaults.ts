import type { Preferences } from "@/types/preferences";
import type { Profile } from "@/types/profile";
import { emptyDealBreakers } from "@/lib/matching/market";

/** A fresh, mostly-empty profile for a brand-new signed-in user. */
export function blankProfile(): Profile {
  return {
    id: "",
    name: "",
    age: 27,
    gender: "",
    city: "",
    religion: "",
    languages: [],
    workStatus: "",
    role: "",
    industry: "",
    workLife: "",
    qualification: "",
    college: "",
    intent: "",
    timeline: "",
    taxBracket: "",
    financialIndependence: "",
    lifestyleExpectation: "",
    drinking: "",
    smoking: "",
    food: "",
    weekend: [],
    fitness: "",
    communication: "",
    conflict: "",
    partnerSupport: "",
    goodRelationship: "",
    workingOn: "",
    children: "",
    partnerWithKids: "",
    livingAfterMarriage: "",
    relocation: "",
    priorities: [],
    interests: [],
    favouriteShow: "",
    listeningTo: "",
    talkForHours: "",
    story: "",
    moments: [{ caption: "" }, { caption: "" }, { caption: "" }],
    photoUrl: "",
    extraPhotoUrls: []
  };
}

export function blankPreferences(): Preferences {
  return {
    ageMin: 24,
    ageMax: 34,
    cityPref: "Open to nearby cities",
    religionPref: "No preference",
    timelinePref: "No preference",
    childrenPref: "No preference",
    relocationPref: "No preference",
    financePref: "No preference",
    smokingPref: "Fine either way",
    drinkingPref: "Fine either way",
    foodPref: "No preference",
    dealBreakers: emptyDealBreakers()
  };
}
