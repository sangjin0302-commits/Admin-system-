"use client";

import { useState } from "react";
import type { Module } from "@/lib/services/certification-course-service";

export function ModulePlayer({ courseId, moduleId, module }: { courseId: string; moduleId: string; module: Module }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function complete() {
    setBusy(true);
    const res = await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, moduleId, answers: module.quiz ? answers : undefined }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setScore(typeof j.score === "number" ? j.score : 100);
    setBusy(false);
  }

  return (
    <div className="mt-6 space-y-6">
      {module.videos.map((v, i) => (
        <div key={i} className="aspect-video overflow-hidden rounded-lg bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={v} controls className="h-full w-full" />
        </div>
      ))}

      {module.quiz && (
        <div className="rounded border border-line bg-surface p-4">
          <h2 className="font-serif text-lg font-bold text-primary">퀴즈: {module.quiz.title}</h2>
          <p className="text-xs text-text-muted">통과 점수: {module.quiz.passingScore}%</p>
          <div className="mt-4 space-y-4">
            {module.quiz.questions.map((q, qi) => (
              <div key={q.id}>
                <p className="font-semibold">
                  Q{qi + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-1">
                  {q.choices.map((c, ci) => (
                    <label key={ci} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        onChange={() => {
                          const next = [...answers];
                          next[qi] = ci;
                          setAnswers(next);
                        }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {score !== null ? (
        <div className="rounded border border-primary bg-primary/5 p-3 text-sm text-primary">
          완료! {module.quiz && `점수 ${score}%`}
        </div>
      ) : (
        <button
          onClick={complete}
          disabled={busy}
          className="rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          {busy ? "저장 중..." : "완료 표시"}
        </button>
      )}
    </div>
  );
}
