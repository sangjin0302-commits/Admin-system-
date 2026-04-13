import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-6 text-center", className)}>
      <div className="mx-auto max-w-md">
        <p className="text-lg font-semibold text-text-strong">{title}</p>
        <p className="mt-2 text-sm text-text-muted">{description}</p>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-4 inline-flex rounded-md border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  className
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-rose-200 bg-rose-50 p-5", className)}>
      <p className="text-sm font-semibold text-danger">{title}</p>
      <p className="mt-2 text-sm text-danger/90">{description}</p>
    </Card>
  );
}

export function LoadingState({
  title = "불러오는 중입니다.",
  description = "데이터를 준비하고 있습니다.",
  rows = 3
}: {
  title?: string;
  description?: string;
  rows?: number;
}) {
  return (
    <Card className="p-6">
      <p className="text-lg font-semibold text-text-strong">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-md border border-line bg-surface-muted p-4">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-200" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StateInline({
  tone = "default",
  children
}: {
  tone?: "default" | "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-sm",
        tone === "error"
          ? "text-danger"
          : tone === "success"
            ? "text-success"
            : "text-text-muted"
      )}
    >
      {children}
    </p>
  );
}
