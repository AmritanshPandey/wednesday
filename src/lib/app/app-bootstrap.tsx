"use client";

import * as React from "react";
import { startLiveSync } from "@/lib/app/store";

/** Starts auth + Firestore subscriptions once, on the client. Renders nothing. */
export function AppBootstrap() {
  React.useEffect(() => {
    startLiveSync();
  }, []);
  return null;
}
