import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  className,
  children
}: PropsWithChildren<{ label: string; hint?: string; className?: string }>) {
  return (
    <div className={className}>
      <label className="ui-label">{label}</label>
      {children}
      {hint ? <p className="mt-2 ui-helper">{hint}</p> : null}
    </div>
  );
}

export function FieldGroup({
  className,
  children
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("grid gap-4", className)}>{children}</div>;
}
