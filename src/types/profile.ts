export type Moment = {
  title?: string;
  imageUrl?: string;
  caption: string;
};

export type Profile = {
  id: string;
  name: string;
  dateOfBirth?: string;
  age: number;
  gender: string;
  city: string;
  religion: string;
  languages: string[];

  workStatus: string;
  role: string;
  industry: string;
  workLife: string;
  qualification: string;
  college: string;

  intent: string;
  timeline: string;

  taxBracket: string;
  financialIndependence: string;
  lifestyleExpectation: string;

  drinking: string;
  smoking: string;
  cannabis: string;
  food: string;
  weekend: string[];
  fitness: string;

  communication: string;
  conflict: string;
  partnerSupport: string;
  goodRelationship: string;
  workingOn: string;

  children: string;
  partnerWithKids: string;
  livingAfterMarriage: string;
  relocation: string;
  priorities: string[];

  interests: string[];
  favouriteShow: string;
  listeningTo: string;
  talkForHours: string;

  story: string;
  moments: Moment[];
  photoUrl?: string;
  localPhotoUrl?: string;
  extraPhotoUrls?: string[];

  linkedinHandle?: string;
  instagramHandle?: string;
};
