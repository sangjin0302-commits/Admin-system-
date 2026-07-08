"use client";

import { useState } from "react";

type Scenario = {
  clientProfile: string;
  situation: string;
  clientQuestion: string;
  hiddenTraps: string[];
  expectedAnswerPoints: string[];
  relatedLaws: string[];
};

type Grading = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missedPoints: string[];
  legalAccuracy: string;
  improvedAnswer: string;
};

const CATEGORIES = [
  "행정심판(처분 취소)",
  "인허가 신청 (일반 영업허가)",
  "인허가 신청 (환경/건축)",
  "이의신청 (과태료)",
  "사실조사 의뢰",
  "계약서 검토",
];
const DIFFICULTY = ["초급", "중급", "고급"];

export default function CaseSimulatorClient() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState("중급");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState<Grading | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState<"gen" | "grade" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    setLoading("gen");
    setErr(null);
    setScenario(null);
    setGrading(null);
    setUserAnswer("");
    setShowAnswers(false);
    try {
      const res = await fetch("/api/admin/mentor/generate-case", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, difficulty }),
      });
      const data = await res.json();
      if (!res.ok || !data.scenario) throw new Error(data?.error?.message ?? "생성 실패");
      setScenario(data.scenario as Scenario);
    } catch (e: any) {
      setErr(e?.message ?? "오류");
    } finally {
      setLoading(null);
    }
  };

  const grade = async () => {
    if (!scenario || !userAnswer.trim()) return;
    setLoading("grade");
    setErr(null);
    try {
      const res = await fetch("/api/admin/mentor/grade-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario, userAnswer }),
      });
      const data = await res.json();
      if (!res.ok || !data.grading) throw new Error(data?.error?.message ?? "채점 실패");
      setGrading(data.grading as Grading);
    } catch (e: any) {
      setErr(e?.message ?? "오류");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 bg-surface-muted">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">난이도</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {DIFFICULTY.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading === "gen"}
            className="bg-black text-white rounded px-4 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading === "gen" ? "생성 중..." : "새 시나리오"}
          </button>
        </div>
      </div>

      {err ? <div className="border border-red-300 bg-red-50 text-red-800 rounded p-3 text-sm">{err}</div> : null}

      {scenario ? (
        <div className="space-y-4">
          <div className="border rounded p-5">
            <p className="ui-kicker">시나리오</p>
            <p className="mt-2 text-sm"><b>클라이언트:</b> {scenario.clientProfile}</p>
            <p className="mt-2 text-sm whitespace-pre-line"><b>상황:</b> {scenario.situation}</p>
            <p className="mt-3 text-sm border-l-4 border-yellow-400 bg-yellow-50 p-3">
              <b>질문:</b> {scenario.clientQuestion}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">답변 작성</label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={8}
              placeholder="클라이언트에게 어떻게 답변하시겠어요? 관련 법령·기한·절차 포함..."
              className="w-full border rounded p-3 text-sm"
              disabled={!!grading}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={grade}
                disabled={loading === "grade" || !userAnswer.trim() || !!grading}
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === "grade" ? "채점 중..." : "AI 채점 요청"}
              </button>
              <button
                onClick={() => setShowAnswers((s) => !s)}
                className="border rounded px-4 py-2 text-sm hover:bg-neutral-50"
              >
                {showAnswers ? "정답 숨기기" : "정답 미리보기"}
              </button>
            </div>
          </div>

          {showAnswers ? (
            <div className="border rounded p-5 bg-neutral-50">
              <p className="ui-kicker">기대 답변 요점</p>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                {scenario.expectedAnswerPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <p className="ui-kicker mt-4">관련 법령</p>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                {scenario.relatedLaws.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <p className="ui-kicker mt-4">숨겨진 함정</p>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1 text-red-700">
                {scenario.hiddenTraps.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ) : null}

          {grading ? (
            <div className="border rounded p-5 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-bold">{grading.score}</span>
                <span className="text-sm text-text-muted">/ 100</span>
              </div>
              <p className="ui-kicker mt-2">강점</p>
              <ul className="mt-1 list-disc list-inside text-sm space-y-0.5">
                {grading.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              <p className="ui-kicker mt-3">개선점</p>
              <ul className="mt-1 list-disc list-inside text-sm space-y-0.5 text-orange-700">
                {grading.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              {grading.missedPoints?.length > 0 ? (
                <>
                  <p className="ui-kicker mt-3">누락된 요점</p>
                  <ul className="mt-1 list-disc list-inside text-sm space-y-0.5 text-red-700">
                    {grading.missedPoints.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </>
              ) : null}
              <p className="ui-kicker mt-3">법령 인용 정확도</p>
              <p className="mt-1 text-sm">{grading.legalAccuracy}</p>
              <p className="ui-kicker mt-3">모범 답변</p>
              <p className="mt-1 text-sm whitespace-pre-line border-l-4 border-green-500 bg-white p-3">
                {grading.improvedAnswer}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
