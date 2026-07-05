"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function Tabs({ tabs, defaultId }: { tabs: Tab[]; defaultId?: string }) {
  const [activeId, setActiveId] = React.useState(defaultId ?? tabs[0]?.id);
  return (
    <div>
      <div className="grid grid-cols-3 rounded-lg bg-secondary p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground", activeId === tab.id && "bg-card text-foreground shadow-sm")}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs.find((tab) => tab.id === activeId)?.content}</div>
    </div>
  );
}
