import "server-only";

import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { FIRESTORE_BATCH_LIMIT } from "@/lib/server/config";
import type { SnapshotDoc, UserDoc } from "@/lib/app/types";
import type { Preferences } from "@/types/preferences";
import type { Profile } from "@/types/profile";

/** Stable content hash of the matching-relevant fields, so an unchanged
 *  snapshot is never rewritten (Firestore write minimization). */
export function snapshotHash(profile: Profile, preferences: Preferences): string {
  return createHash("sha1").update(JSON.stringify({ profile, preferences })).digest("hex");
}

function snapshotsRef(weekId: string) {
  return adminDb().collection("weeks").doc(weekId).collection("snapshots");
}

/**
 * Freeze a slice of active users into immutable weekly snapshots. Idempotent:
 * the doc id is the uid and the write is skipped when the hash already matches,
 * so re-running (or resuming after a crash) is safe and cheap. Returns how many
 * of THIS slice were written, for logging.
 */
export async function freezeSnapshots(weekId: string, users: UserDoc[]): Promise<number> {
  const col = snapshotsRef(weekId);
  // Read existing hashes once to decide what actually needs writing.
  const existing = await col.select("hash").get();
  const existingHash = new Map(existing.docs.map((d) => [d.id, (d.data() as { hash?: string }).hash]));

  let written = 0;
  let batch = adminDb().batch();
  let ops = 0;
  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = adminDb().batch();
      ops = 0;
    }
  };

  for (const user of users) {
    const hash = snapshotHash(user.profile, user.preferences);
    if (existingHash.get(user.uid) === hash) continue; // unchanged — skip the write
    const snap: SnapshotDoc = {
      uid: user.uid,
      weekId,
      profile: user.profile,
      preferences: user.preferences,
      hash,
      frozenAt: Date.now()
    };
    batch.set(col.doc(user.uid), snap);
    ops += 1;
    written += 1;
    if (ops >= FIRESTORE_BATCH_LIMIT) await flush();
  }
  await flush();
  return written;
}

/** All frozen snapshots for a week — the ONLY profile source matching may read. */
export async function getSnapshots(weekId: string): Promise<Map<string, SnapshotDoc>> {
  const snap = await snapshotsRef(weekId).get();
  return new Map(snap.docs.map((d) => [d.id, d.data() as SnapshotDoc]));
}
