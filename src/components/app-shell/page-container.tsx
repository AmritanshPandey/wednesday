import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function PageContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-5", className)} {...props} />;
}
