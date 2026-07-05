"use client";

import { useState } from "react";

export function FranchiseActions({ id, action }: { id: string; action: "provision" | "suspend" }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    if (action === "provision") {
      await fetch(`/api/admin/franchise/${id}/provision`, { method: "POST" });
    } else {
      await fetch(`/api/admin/franchise/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });
    }
    setBusy(false);
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="rounded border border-primary px-3 py-1 text-xs font-bold text-primary disabled:opacity-50"
    >
      {busy ? "..." : action === "provision" ? "프로비저닝" : "중단"}
    </button>
  );
}
