"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InquiryPromoteButton({
  inquiryId,
  enabled = true,
}: {
  inquiryId: string;
  enabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return null;

  async function handlePromote() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/promote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "사건 생성 실패");
        return;
      }
      router.push(`/admin/cases/${data.caseId}`);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePromote}
        disabled={loading}
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "생성 중…" : "사건 생성"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
