# Testing the UI with fake accounts (local emulator)

Log in as fake members and click through the real app — including a live
two-account chat — with **zero risk to production**. Everything runs in the
local Firebase emulator; nothing touches the shared `wednesday-introductions`
project.

## Prerequisites (one-time)

- **Firebase CLI**: `firebase --version` (you already have it). Install: `npm i -g firebase-tools`.
- **Java 21+** (the Firestore emulator requires it — current `firebase-tools` rejects
  anything below 21). Check with `java -version`. On macOS:
  ```bash
  brew install --cask temurin        # installs the latest LTS (21+)
  ```
  If you have multiple JDKs, point the emulator at 21:
  `export JAVA_HOME=$(/usr/libexec/java_home -v 21)`.

## Run it

Three terminals:

```bash
# 1. Start the emulators (Auth + Firestore). Leave running.
npm run emulator

# 2. Seed 40 fake members, real pools/matches, and one live chat.
npm run seed

# 3. Start the app pointed at the emulator.
npm run dev:emulator
```

Then open **http://localhost:3000/dev/login** and pick a member.

## What you get

- **40 fake members** (`member01`…`member40@wednesday.test`, password `test1234`)
  with full profiles, real compatibility-scored pools, and a real weekly allocation.
- **`member01` ↔ `member02` are pre-connected** with two opening letters and a
  live chat (~5 days left on the window). Log in as `member01` and open the chat;
  open `member02` in an incognito window to reply in real time.
- To test the reveal/ranking screens, use the in-app dev **time machine** to jump
  to Wednesday. The chat itself is reachable any day via the member's `activeChat`.

## Notes

- **Dev-only, by design**: `/dev/login` and email/password sign-in render only when
  `NEXT_PUBLIC_USE_EMULATOR=true` (set by `npm run dev:emulator`). They can never be a
  login backdoor in production, where auth stays Google-only.
- **Reset**: stop the emulator and re-run `npm run seed` for a clean slate (emulator
  data is in-memory unless you pass `--export-on-exit`).
- **Photos** use pravatar.cc; if you're offline they fall back to monogram initials.
