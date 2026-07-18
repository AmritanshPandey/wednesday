import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** Server-side Admin SDK. Reads a service-account key from env — except when
 *  the Firestore emulator host is set (npm run dev:emulator), where it needs
 *  only a projectId and talks to the local emulator with no real credentials. */
function ensureAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Emulator mode: no service account required.
    return initializeApp({ projectId: projectId || "demo-wednesday" });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel stores the key with literal \n; convert back to real newlines.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminDb(): Firestore {
  return getFirestore(ensureAdminApp());
}

export function adminAuth(): Auth {
  return getAuth(ensureAdminApp());
}
