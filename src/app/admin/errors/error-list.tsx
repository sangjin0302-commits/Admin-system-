"use client";

import { useState, useTransition } from "react";

import type { ErrorEvent } from "@/lib/services/error-monitor-service";

type Props = {
  initialErrors: ErrorEvent[];
};

export function ErrorList({ initialErrors }: Props) {
  const [errors, setErrors] = useState(initialErrors);
  const [isPending, startTransition] = useTransition();

  const handleResolve = (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/errors/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
          setErrors((prev) =>
            prev.map((e) => (e.id === id ? { ...e, resolved: true } : e))
          );
        }
      } catch {
        // ignore
      }
    });
  };

  if (errors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">기록된 오류가 없습니다.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {errors.map((evt) => (
        <li
          key={evt.id}
          className="border rounded p-3 flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono uppercase">{evt.level}</span>
              <span className="text-muted-foreground">
                {new Date(evt.timestamp).toLocaleString()}
              </span>
              {evt.resolved ? (
                <span className="text-success">해결됨</span>
              ) : null}
            </div>
            <div className="text-sm font-medium truncate">{evt.message}</div>
            {evt.stack ? (
              <pre className="text-xs mt-1 whitespace-pre-wrap break-all opacity-70 max-h-32 overflow-auto">
                {evt.stack}
              </pre>
            ) : null}
          </div>
          {!evt.resolved ? (
            <button
              type="button"
              onClick={() => handleResolve(evt.id)}
              disabled={isPending}
              className="text-xs px-2 py-1 border rounded"
            >
              해결 처리
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
