"use client";

import { useEffect, useState } from "react";

const LABEL_COLOR: Record<string, string> = {
  요구: "bg-blue-100 text-blue-800",
  공포: "bg-red-100 text-red-800",
  불만: "bg-orange-100 text-orange-800",
  문의: "bg-emerald-100 text-emerald-800",
};

type LabelData = { labels: string[]; primary: string };

export function InquiryLabelBadge({
  inquiryId,
  enabled = true,
}: {
  inquiryId: string;
  enabled?: boolean;
}) {
  const [data, setData] = useState<LabelData | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch(`/api/admin/inquiries/${inquiryId}/labels`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return;
        setData(json.data as LabelData);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [inquiryId, enabled]);

  if (!enabled || !data?.labels?.length) return null;

  return (
    <span className="inline-flex items-center gap-0.5">
      {data.labels.map((l) => (
        <span
          key={l}
          className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-none ${LABEL_COLOR[l] ?? "bg-gray-100 text-gray-700"}`}
        >
          {l}
        </span>
      ))}
    </span>
  );
}
