import type { PropsWithChildren, TableHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function TableContainer({
  className,
  children
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-surface shadow-panel", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ className, children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("ui-table", className)} {...props}>
      {children}
    </table>
  );
}
