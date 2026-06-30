"use client";

import { useState } from "react";

interface SurveyFormProps {
  token: string;
  clientName: string | null;
}

const CATEGORIES = [
  { value: "overall", label: "전체 서비스" },
  { value: "speed", label: "처리 속도" },
  { value: "quality", label: "서비스 품질" },
  { value: "communication", label: "소통/커뮤니케이션" },
  { value: "cost", label: "비용 적정성" },
] as const;

function scoreColor(score: number): string {
  if (score <= 6) return "bg-red-500 hover:bg-red-600 text-white";
  if (score <= 8) return "bg-amber-400 hover:bg-amber-500 text-white";
  return "bg-green-500 hover:bg-green-600 text-white";
}

function scoreColorSelected(score: number): string {
  if (score <= 6) return "bg-red-600 ring-2 ring-red-800 text-white";
  if (score <= 8) return "bg-amber-500 ring-2 ring-amber-700 text-white";
  return "bg-green-600 ring-2 ring-green-800 text-white";
}

export function SurveyForm({ token, clientName }: SurveyFormProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("overall");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (score === null) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, score, feedback: feedback || undefined, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "제출에 실패했습니다.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">감사합니다!</h1>
          <p className="text-gray-600">소중한 의견이 더 나은 서비스를 만드는 데 큰 도움이 됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#1a3c5f" }}>
            ETHOS 행정사사무소
          </h1>
          <p className="text-sm text-gray-500 mt-1">서비스 만족도 조사</p>
          {clientName && (
            <p className="text-gray-700 mt-4">
              <span className="font-semibold">{clientName}</span>님, 안녕하세요.
            </p>
          )}
          <p className="text-gray-600 mt-2 text-sm">
            저희 서비스에 대한 만족도를 평가해 주세요.
          </p>
        </div>

        {/* NPS Score */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            서비스를 주변에 추천할 의향이 어느 정도인가요?
          </label>
          <div className="flex justify-between gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScore(i)}
                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                  score === i ? scoreColorSelected(i) : scoreColor(i)
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>전혀 추천하지 않음</span>
            <span>매우 추천함</span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            가장 중요하게 평가하신 항목
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feedback */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            추가 의견 (선택)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="개선이 필요한 점이나 좋았던 점을 알려주세요..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={score === null || loading}
          className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: score !== null ? "#1a3c5f" : "#9ca3af" }}
        >
          {loading ? "제출 중..." : "제출하기"}
        </button>
      </div>
    </div>
  );
}
