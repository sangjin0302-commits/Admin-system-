"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DetectResult = { type: string; matches: string[] }[];

export function PiiForm() {
  const [text, setText] = useState(
    "홍길동 010-1234-5678 / 주민번호 900101-1234567 / email test@example.com / 카드 1234-5678-9012-3456",
  );
  const [masked, setMasked] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: "detect" | "mask") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pii-mask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action }),
      });
      const data = await res.json();
      if (action === "mask") {
        setMasked(data.masked ?? "");
        setDetected(null);
      } else {
        setDetected(data.detected ?? []);
        setMasked(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <label className="block text-sm font-semibold text-text-strong">입력 텍스트</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button onClick={() => run("detect")} disabled={loading} variant="secondary">
          PII 탐지
        </Button>
        <Button onClick={() => run("mask")} disabled={loading}>
          마스킹 실행
        </Button>
      </div>

      {detected && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">탐지 결과</p>
          {detected.length === 0 ? (
            <p className="text-sm text-text-muted">탐지된 PII가 없습니다.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {detected.map((d) => (
                <li key={d.type}>
                  <span className="font-semibold">{d.type}</span>: {d.matches.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {masked !== null && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">마스킹 결과</p>
          <pre className="whitespace-pre-wrap rounded-md bg-surface-muted p-3 text-sm">{masked}</pre>
        </div>
      )}
    </Card>
  );
}
