"use client";

import { useEffect, useState } from "react";

interface SuggestResult {
  suggest: boolean;
  reason: string;
  suggestedCategory?: string;
}

export function AutoCaseSuggestBanner({ inquiryId }: { inquiryId: string }) {
  const [data, setData] = useState<SuggestResult | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/inquiries/${inquiryId}/case-suggest`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [inquiryId]);

  if (!data?.suggest || done) return null;

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/promote`, {
        method: "POST",
      });
      if (res.ok) setDone(true);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-center justify-between gap-3">
        <p>
          <span className="font-bold">{data.reason}</span> — 사건으로 전환하시겠습니까?
        </p>
        <button
          onClick={handlePromote}
          disabled={promoting}
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {promoting ? "전환 중..." : "사건 전환"}
        </button>
      </div>
    </div>
  );
}
