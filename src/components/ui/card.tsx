import * as React from "react";
import { cn } from "@/lib/utils";

/** Surface-1 panel with a 1px hairline border. Depth via lift, never shadow. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-1 border border-hairline edge-highlight",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-2 text-ink-muted " +
          "border border-hairline px-2 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}
