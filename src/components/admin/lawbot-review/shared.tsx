"use client";

import { Badge } from "@/components/ui/badge";

export type LoadingState = "idle" | "loading" | "loaded" | "error";

export function toStatusBadgeTone(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("APPROVAL_PENDING")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized.includes("FAILED") || normalized.includes("ERROR")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-line-strong bg-surface text-text-strong";
}

export function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge
      className={
        value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line-strong bg-surface text-text-strong"
      }
    >
      {value ? "예" : "아니오"}
    </Badge>
  );
}

export function SafeBooleanLabel({ value }: { value: boolean }) {
  return <span className={value ? "text-emerald-700" : "text-rose-700"}>{value ? "예" : "아니오"}</span>;
}
