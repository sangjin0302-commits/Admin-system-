import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    muted?: boolean;
    compact?: boolean;
  }
>;

export function Card({ className, children, muted, compact, ...props }: CardProps) {
  return (
    <div
      className={cn(
        compact ? "ui-card-compact" : muted ? "ui-card-muted" : "ui-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
