"use client";

import * as React from "react";
import { IconPhotoPlus } from "@tabler/icons-react";

export function LocalImagePicker({ onPreview }: { onPreview: (url: string) => void }) {
  const [error, setError] = React.useState<string | null>(null);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image under 5 MB.");
      return;
    }

    // Object URLs keep the prototype upload-free. They may stop working after a full browser reload because no image binary is stored.
    onPreview(URL.createObjectURL(file));
    setError(null);
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} />
        <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-secondary">
          <IconPhotoPlus className="h-4 w-4" stroke={2.2} />
          Choose profile photo
        </span>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
