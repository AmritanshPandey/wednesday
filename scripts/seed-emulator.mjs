// Seed the local Firebase emulators with fake members so you can log in as
// different people and click through the real UI — including a live 2-account
// chat. SAFE: talks only to the emulator, never the shared prod project.
//
//   1) npm run emulator      (starts Auth + Firestore emulators)
//   2) npm run seed          (this script)
//   3) npm run dev:emulator  (Next app pointed at the emulator)
//   4) open http://localhost:3000/dev/login
//
// Run directly: tsx --tsconfig tsconfig.seed.json scripts/seed-emulator.mjs

// Point the Admin SDK at the emulators BEFORE it initialises.
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { buildPoolFor } from "../src/lib/server/pool.ts";
import { allocateWeek } from "../src/lib/server/allocate.ts";
import { computeWeekClock } from "../src/lib/week.ts";
import { threadIdFor, toPublicProfile } from "../src/lib/app/types.ts";
import { blankPreferences, blankProfile } from "../src/lib/app/defaults.ts";
import {
  CITIES, LANGUAGES, WORK_STATUSES, WORK_LIVES, QUALIFICATIONS,
  INTENTS, TIMELINES, TAX_BRACKETS, FINANCIAL_INDEPENDENCE, LIFESTYLE_EXPECTATIONS,
  DRINKING, SMOKING, CANNABIS, FOODS, WEEKENDS, FITNESS,
  COMMUNICATION_STYLES, CONFLICT_STYLES, PARTNER_SUPPORT,
  CHILDREN_VIEWS, PARTNER_WITH_KIDS, LIVING_AFTER_MARRIAGE, RELOCATION,
  PRIORITIES, INTERESTS, ROLES
} from "../src/lib/profile-options.ts";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wednesday-introductions";
const COUNT = 40;
const PASSWORD = "test1234";
const FIRST_NAMES = ["Aarav","Isha","Kabir","Meera","Rohan","Ananya","Vikram","Priya","Arjun","Nisha","Dev","Tara","Kian","Riya","Aditya","Sara","Neel","Diya","Yash","Kavya","Reyansh","Aisha","Vivaan","Myra","Ishaan","Anika","Advait","Zara","Kiaan","Navya","Rudra","Saanvi","Ayaan","Aadhya","Shaurya","Pari","Vihaan","Kiara","Atharv","Anvi"];

let seed = 20260716;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rand() * a.length)];
const pickN = (a, n) => { const c = [...a], o = []; for (let i = 0; i < n && c.length; i++) o.push(c.splice(Math.floor(rand() * c.length), 1)[0]); return o; };
const id2 = (i) => String(i + 1).padStart(2, "0");

function makeUser(i) {
  const uid = `member${id2(i)}`;
  const gender = i % 2 === 0 ? "Male" : "Female"; // balanced; member01=M, member02=F
  const age = 24 + Math.floor(rand() * 11);
  const name = FIRST_NAMES[i % FIRST_NAMES.length];
  const profile = {
    ...blankProfile(), id: uid, name, age, gender,
    city: pick(CITIES), religion: pick(["Hindu", "Hindu", "Sikh", "Christian", "Muslim", "Jain", "Spiritual, not religious"]),
    languages: pickN(LANGUAGES, 1 + Math.floor(rand() * 3)),
    workStatus: pick(WORK_STATUSES), role: pick(ROLES), industry: "Technology",
    workLife: pick(WORK_LIVES), qualification: pick(QUALIFICATIONS), college: "—",
    intent: pick(INTENTS), timeline: pick(TIMELINES), taxBracket: pick(TAX_BRACKETS),
    financialIndependence: pick(FINANCIAL_INDEPENDENCE), lifestyleExpectation: pick(LIFESTYLE_EXPECTATIONS),
    drinking: pick(DRINKING), smoking: pick(SMOKING), cannabis: pick(CANNABIS), food: pick(FOODS),
    weekend: pickN(WEEKENDS, 1 + Math.floor(rand() * 2)), fitness: pick(FITNESS),
    communication: pick(COMMUNICATION_STYLES), conflict: pick(CONFLICT_STYLES), partnerSupport: pick(PARTNER_SUPPORT),
    goodRelationship: "Trust and laughter.", workingOn: "Being more present.",
    children: pick(CHILDREN_VIEWS), partnerWithKids: pick(PARTNER_WITH_KIDS),
    livingAfterMarriage: pick(LIVING_AFTER_MARRIAGE), relocation: pick(RELOCATION),
    priorities: pickN(PRIORITIES, 2 + Math.floor(rand() * 2)),
    interests: pickN(INTERESTS, 3 + Math.floor(rand() * 4)),
    favouriteShow: "The Office", listeningTo: "Prateek Kuhad", talkForHours: "travel and food",
    story: `${name} — ${age}, ${pick(["easygoing", "curious", "warm", "driven"])} and here with intention.`,
    photoUrl: `https://i.pravatar.cc/320?img=${(i % 70) + 1}`
  };
  const preferences = { ...blankPreferences(), dealBreakers: { ...blankPreferences().dealBreakers } };
  preferences.ageMin = Math.max(22, age - 5);
  preferences.ageMax = Math.min(35, age + 6);
  return {
    uid, email: `${uid}@wednesday.test`, displayName: name, photoURL: null,
    profile, preferences, setupComplete: true, setupStepReached: 12,
    joinedWeekId: null, status: "active", createdAt: Date.now(), updatedAt: Date.now()
  };
}

async function main() {
  const app = initializeApp({ projectId: PROJECT_ID });
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { weekId } = computeWeekClock();

  console.log(`Seeding ${COUNT} fake members into the EMULATOR (week ${weekId})…`);

  const users = Array.from({ length: COUNT }, (_, i) => ({ ...makeUser(i), joinedWeekId: weekId, activeWeekId: weekId }));

  // 1) Auth users + user docs.
  for (const u of users) {
    try {
      await auth.createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.displayName });
    } catch (e) {
      if (!String(e).includes("already exists")) throw e;
    }
    await db.collection("users").doc(u.uid).set(u);
  }
  console.log(`  ✓ ${users.length} accounts + profiles`);

  // 2) Pools + allocation for the week (real matching logic).
  const pools = new Map();
  for (const me of users) {
    const b = buildPoolFor(me, users);
    const pool = { uid: me.uid, weekId, entries: b.entries, allocationTail: b.allocationTail, candidatesConsidered: b.candidatesConsidered, passedDealBreakers: b.passedDealBreakers, builtAt: Date.now() };
    pools.set(me.uid, pool);
    await db.collection("weeks").doc(weekId).collection("pools").doc(me.uid).set(pool);
    // Seed a fresh ranking (dealt into rounds of five).
    const ids = b.entries.map((e) => e.profileId);
    const roundCount = Math.max(1, Math.ceil(ids.length / 5));
    const buckets = Array.from({ length: roundCount }, () => []);
    ids.forEach((id, i) => buckets[i % roundCount].push(id));
    const rounds = buckets.map((bucket, i) => ({ round: i + 1, isFinal: false, profileIds: bucket, rankedOrder: [...bucket], submitted: false }));
    await db.collection("weeks").doc(weekId).collection("rankings").doc(me.uid).set({ uid: me.uid, weekId, rounds, submitted: false, updatedAt: Date.now() });
  }
  const outcomes = allocateWeek(weekId, users, pools, new Map());
  for (const o of outcomes) {
    await db.collection("weeks").doc(weekId).collection("matches").doc(o.uid).set({
      uid: o.uid, weekId, matchUid: o.matchUid, profile: o.profile, compatibility: o.compatibility,
      breakdown: o.breakdown, reasons: o.reasons, status: o.status, threadId: o.threadId,
      stats: o.stats, revealedAt: Date.now()
    });
  }
  const matched = outcomes.filter((o) => o.status === "revealed").length;
  console.log(`  ✓ pools + allocation (${matched}/${outcomes.length} matched)`);

  // 3) Force member01 ↔ member02 into a live, connected chat with seed messages.
  const a = users[0], b = users[1];
  const threadId = threadIdFor(weekId, a.uid, b.uid);
  const connectedAt = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days in → ~5 days left
  const setConnected = async (me, other) => {
    await db.collection("weeks").doc(weekId).collection("matches").doc(me.uid).set({
      uid: me.uid, weekId, matchUid: other.uid, profile: { ...toPublicProfile(other.profile), id: other.uid },
      compatibility: 88, breakdown: [], reasons: ["You are both here with intention"], status: "connected",
      threadId, connectedAt, stats: null, revealedAt: connectedAt
    }, { merge: true });
    await db.collection("users").doc(me.uid).set({
      activeChat: { threadId, weekId, matchUid: other.uid, connectedAt, matchName: other.profile.name, matchPhotoUrl: other.profile.photoUrl ?? null }
    }, { merge: true });
  };
  await setConnected(a, b);
  await setConnected(b, a);
  await db.collection("threads").doc(threadId).set({ weekId, participants: [a.uid, b.uid].sort() }, { merge: true });
  // Two opening letters + a couple of chat messages.
  const letters = db.collection("threads").doc(threadId).collection("letters");
  await letters.add({ authorUid: a.uid, body: `Dear ${b.profile.name},\n\nYour postcard made me smile — the bit about ${b.profile.talkForHours}. I'd love to hear more.`, createdAt: connectedAt });
  await letters.add({ authorUid: b.uid, body: `Dear ${a.profile.name},\n\nThat's kind of you. I've been meaning to ask what your ideal Sunday looks like.`, createdAt: connectedAt + 3600_000 });
  const messages = db.collection("threads").doc(threadId).collection("messages");
  await messages.add({ authorUid: b.uid, body: "Also — coffee or tea person? Important question 😄", createdAt: connectedAt + 7200_000 });
  await messages.add({ authorUid: a.uid, body: "Filter coffee, always. You?", createdAt: connectedAt + 7300_000 });
  console.log(`  ✓ member01 ↔ member02 connected with a live chat`);

  console.log(`\nDone. Next:`);
  console.log(`  • npm run dev:emulator   then open  http://localhost:3000/dev/login`);
  console.log(`  • Log in as member01@wednesday.test  (password: ${PASSWORD})  → open chat to see the 7-day conversation`);
  console.log(`  • Open member02 in a separate/incognito window to chat as the other side in real time`);
  console.log(`  • Emulator UI: http://127.0.0.1:4000`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
