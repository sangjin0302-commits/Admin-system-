"use client";

import { useState } from "react";

const ROLES = ["SUPER", "MANAGER", "STAFF", "EXTERNAL", "AUDITOR"] as const;

export function UserActionsMenu({
  userId,
  currentRole,
  active,
}: {
  userId: string;
  currentRole: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "변경 실패");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-line px-2 py-1 text-xs"
      >
        ⋯
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <select
        defaultValue={currentRole}
        disabled={busy}
        onChange={(e) => {
          if (e.target.value !== currentRole) patch({ role: e.target.value });
        }}
        className="rounded border border-line bg-white px-1.5 py-0.5 text-xs"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ active: !active })}
        className={`rounded px-2 py-1 text-xs ${
          active
            ? "border border-rose-300 text-rose-700"
            : "border border-emerald-300 text-emerald-700"
        }`}
      >
        {active ? "비활성" : "활성"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded border border-line px-2 py-1 text-xs"
      >
        닫기
      </button>
    </div>
  );
}
