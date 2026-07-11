# Wednesday — going live

The app is fully coded and **already points at a Firebase project I created for
you** (`wednesday-introductions`). To turn it on you only need to (a) enable a
couple of things in consoles and (b) paste a handful of secrets into
`.env.local`. Everywhere you need to paste something is marked **① ② ③ …**
below and matches a blank in `.env.local.example`.

```bash
cp .env.local.example .env.local   # then fill the blanks below
```

The client-side Firebase keys are already filled in for you. The blanks are:
the Firebase **Admin** service account, the **Cloudflare R2** keys, and a
**CRON_SECRET**.

---

## 1. Firebase console (one-time clicks) — no paste

Open the project: <https://console.firebase.google.com/project/wednesday-introductions>

- **Enable Firestore** — Build → Firestore Database → *Create database* →
  Production mode → location `nam5` (US) or `asia-south1` (Mumbai). *(The CLI
  couldn't do this one automatically — it needs the first click from you.)*
- **Enable Google sign-in** — Build → Authentication → *Get started* →
  Sign-in method → **Google** → Enable → pick a support email → Save.
- **Add your dev domain** — Authentication → Settings → Authorized domains →
  add `localhost` (usually already there). Add your Vercel domain later.

Then deploy the security rules (from this folder):

```bash
firebase deploy --only firestore:rules --project wednesday-introductions
```

## 2. Firebase Admin key → paste **②③** into `.env.local`

Console → ⚙️ Project settings → **Service accounts** → *Generate new private
key* → downloads a JSON. From that JSON copy:

- `client_email`  → **②** `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key`   → **③** `FIREBASE_ADMIN_PRIVATE_KEY`
  (keep it on one line with the literal `\n` sequences, wrapped in quotes)

`FIREBASE_ADMIN_PROJECT_ID` is already set.

## 3. Cloudflare R2 (profile photos) → paste **④⑤⑥⑦**

In the Cloudflare dashboard → **R2**:

1. **Create a bucket** named `wednesday-photos` (or change `R2_BUCKET`).
2. Bucket → Settings → **Public access** → enable the **r2.dev** subdomain
   (or attach a custom domain). Copy that public URL.
3. R2 → **Manage R2 API Tokens** → *Create API token* → Object Read & Write.

Paste:

- Account ID (R2 overview page)        → **④** `R2_ACCOUNT_ID`
- Access Key ID                        → **⑤** `R2_ACCESS_KEY_ID`
- Secret Access Key                    → **⑥** `R2_SECRET_ACCESS_KEY`
- Public bucket URL (e.g. `https://pub-abc123.r2.dev`) → **⑦** `NEXT_PUBLIC_R2_PUBLIC_URL`

Also add a **CORS policy** to the bucket so browsers can upload directly
(R2 → your bucket → Settings → CORS policy):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR-VERCEL-DOMAIN"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

> If R2 is left blank the app still runs — photos just fall back to a local
> preview that won't persist or show to other users.

## 4. Cron secret → paste **⑧**

Any long random string protects the weekly jobs:

```bash
openssl rand -hex 32   # copy output → ⑧ CRON_SECRET
```

---

## Run it locally

```bash
npm run dev
```

Sign in with Google, complete your profile, and **Verify and join this week**.
Because the weekly reveal is real time, use the **dev time machine** (the
floating date chip, on when `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true`) to jump to
Wednesday and **Run allocation now** without waiting.

To see a real mutual introduction you need **two accounts** (one Male, one
Female profile — MVP matches across that line): sign in as each in two
browsers/profiles, both join, both rank, then Run allocation. Each writes one
letter; when both have written, it becomes mutual.

## Deploy (Vercel, free tier)

1. Push to GitHub, import the repo in Vercel.
2. Add every `.env.local` value to Vercel → Project → Settings → Environment
   Variables. Set `NEXT_PUBLIC_ENABLE_DEV_TOOLS=false` in Production.
3. `vercel.json` already schedules the two cron jobs (Thursday 00:00 IST pool
   build, Wednesday 09:00 IST allocation). Vercel Cron sends `CRON_SECRET`
   automatically via the `Authorization` header.
4. Add your Vercel domain to Firebase Authorized domains and the R2 CORS list.

---

## How the live cycle works

| When (IST)        | What happens                                                        |
|-------------------|---------------------------------------------------------------------|
| Join anytime      | `/api/join` builds your pool from the week's other joined users     |
| Thu 00:00         | `cron/build-pools` rebuilds everyone's pool of ≤25                   |
| Thu–Tue           | Rank your pool (five at a time, then a final round)                 |
| **Wed 09:00**     | `cron/allocate` runs Gale-Shapley → one introduction each           |
| **Thu 21:00**     | Deadline to post your one letter; mutual when both write            |

Data model (Firestore): `users/{uid}`, `weeks/{weekId}/pools|rankings|matches/{uid}`,
`threads/{threadId}/letters/*`. Pools and matches are written only by the
server (Admin SDK); clients read their own and rank directly. Letters go
through `/api/letters`. Security rules enforce all of this.

**Known MVP limits:** matching is Male↔Female only (orientation-aware matching
is a follow-up); the in-app date chips on some screens still show placeholder
dates from the prototype clock (cosmetic — the real cycle logic lives in
`src/lib/week.ts`).
