import * as React from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactElement<{ title?: string }> }) {
  return React.cloneElement(children, { title: label });
}
