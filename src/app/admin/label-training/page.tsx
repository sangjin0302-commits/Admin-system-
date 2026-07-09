"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type Feedback = { inquiryId: string; labelKey: string; correct: boolean; createdAt: string };

type InquiryRow = {
  id: string;
  title: string;
  inquiryType: string;
  urgencyLevel: string;
  classificationConfidence: number;
  createdAt: string;
  feedback: Feedback[];
};

type Data = {
  inquiries: InquiryRow[];
  stats: { total: number; correct: number; accuracy: number };
};

export default function LabelTrainingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/label-training", { cache: "no-store" });
    if (res.ok) setData((await res.json()) as Data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(inquiryId: string, labelKey: string, correct: boolean) {
    setBusy(`${inquiryId}:${labelKey}`);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/label-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, labelKey, correct }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(`오류: ${err.error ?? res.statusText}`);
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI"
        title="문의 라벨링 재학습"
        description="자동 라벨 결과에 정답/오답을 표시해 프롬프트 튜닝 자료로 축적합니다."
      />

      {stats && (
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <KPI label="총 피드백" value={stats.total.toLocaleString()} />
            <KPI label="정답" value={stats.correct.toLocaleString()} />
            <KPI label="정답률" value={`${(stats.accuracy * 100).toFixed(1)}%`} />
          </div>
        </Card>
      )}

      {message && (
        <Card className="p-3 text-sm">
          {message}
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">최근 자동 라벨링된 문의</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left">문의</th>
              <th className="py-2 text-left">라벨</th>
              <th className="py-2 text-right">신뢰도</th>
              <th className="py-2 text-right">피드백</th>
            </tr>
          </thead>
          <tbody>
            {data?.inquiries.flatMap((row) => [
              <Row key={`${row.id}-type`} row={row} labelKey="inquiryType" labelValue={row.inquiryType} busy={busy} onSubmit={submit} />,
              <Row key={`${row.id}-urg`} row={row} labelKey="urgencyLevel" labelValue={row.urgencyLevel} busy={busy} onSubmit={submit} />,
            ])}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Row({
  row,
  labelKey,
  labelValue,
  busy,
  onSubmit,
}: {
  row: InquiryRow;
  labelKey: string;
  labelValue: string;
  busy: string | null;
  onSubmit: (inquiryId: string, labelKey: string, correct: boolean) => void;
}) {
  const existing = row.feedback.find((f) => f.labelKey === labelKey);
  const key = `${row.id}:${labelKey}`;
  return (
    <tr className="border-b border-border/50">
      <td className="py-2">
        <div className="font-medium">{row.title}</div>
        <div className="text-xs text-text-muted">{row.id}</div>
      </td>
      <td className="py-2">
        <span className="text-xs text-text-muted">{labelKey}=</span>
        {labelValue}
      </td>
      <td className="py-2 text-right">{(row.classificationConfidence * 100).toFixed(0)}%</td>
      <td className="py-2 text-right">
        {existing ? (
          <span className={existing.correct ? "text-emerald-600" : "text-rose-600"}>
            {existing.correct ? "정답" : "오답"}
          </span>
        ) : (
          <div className="inline-flex gap-2">
            <button
              disabled={busy === key}
              onClick={() => onSubmit(row.id, labelKey, true)}
              className="rounded border border-emerald-600 px-2 py-1 text-xs text-emerald-700 disabled:opacity-50"
            >
              정답
            </button>
            <button
              disabled={busy === key}
              onClick={() => onSubmit(row.id, labelKey, false)}
              className="rounded border border-rose-600 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
            >
              오답
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-text-strong">{value}</div>
    </div>
  );
}
