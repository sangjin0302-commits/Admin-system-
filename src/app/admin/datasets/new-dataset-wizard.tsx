"use client";

import { useState } from "react";

type Step = "category" | "preview" | "publish" | "done";

const CATEGORIES = [
  { value: "visa", label: "비자/체류" },
  { value: "appeal", label: "행정심판" },
  { value: "contract", label: "계약서/사실조사" },
  { value: "license", label: "인허가" },
  { value: "corporate", label: "법인" },
  { value: "mixed", label: "혼합" },
];

export function NewDatasetWizard() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState("visa");
  const [preview, setPreview] = useState<string>("");
  const [size, setSize] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(500_000);
  const [license, setLicense] = useState<"research" | "commercial" | "exclusive">("research");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePreview() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/datasets/preview?category=${category}`);
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && j?.ok) {
      setPreview(j.jsonl ?? "");
      setSize(j.size ?? 0);
      setStep("preview");
    } else {
      setError(j?.error ?? "PREVIEW_FAILED");
    }
  }

  async function publish() {
    setBusy(true);
    const res = await fetch("/api/admin/datasets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        category,
        price,
        size,
        license,
        sampleJsonl: preview.split("\n").slice(0, 3).join("\n"),
        published: true,
      }),
    });
    setBusy(false);
    if (res.ok) setStep("done");
    else setError("PUBLISH_FAILED");
  }

  if (step === "done") {
    return (
      <div className="rounded border border-primary bg-primary/5 p-4">
        <p className="font-bold text-primary">데이터셋이 카탈로그에 발행되었습니다.</p>
        <button className="mt-2 text-xs underline" onClick={() => window.location.reload()}>
          목록 새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-xs font-bold uppercase text-gold-deep">새 데이터셋 준비 · {step}</p>
      {step === "category" && (
        <div className="mt-3 space-y-3">
          <label className="text-sm font-semibold">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-line px-3 py-2">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button disabled={busy} onClick={generatePreview} className="rounded bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "익명화 중..." : "샘플 미리보기 생성"}
          </button>
        </div>
      )}
      {step === "preview" && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-text-muted">추출 {size}건 · 익명화 후 미리보기 3건</p>
          <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-[10px]">{preview.slice(0, 800)}</pre>
          <button onClick={() => setStep("publish")} className="rounded bg-primary px-4 py-2 text-sm font-bold text-white">
            다음: 가격·라이선스
          </button>
        </div>
      )}
      {step === "publish" && (
        <div className="mt-3 space-y-3">
          <input placeholder="데이터셋명" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-line px-3 py-2" />
          <textarea placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border border-line px-3 py-2" rows={2} />
          <div className="flex gap-2">
            <input type="number" placeholder="가격" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="flex-1 rounded border border-line px-3 py-2" />
            <select value={license} onChange={(e) => setLicense(e.target.value as "research" | "commercial" | "exclusive")} className="flex-1 rounded border border-line px-3 py-2">
              <option value="research">연구용</option>
              <option value="commercial">상업용</option>
              <option value="exclusive">독점</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || !name} onClick={publish} className="rounded bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "발행 중..." : "발행하기"}
          </button>
        </div>
      )}
    </div>
  );
}
