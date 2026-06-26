"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { PUBLIC_CATEGORY_LABEL, toPublicCategory } from "@/lib/services/blog-categorizer";

function Inner() {
  const sp = useSearchParams();
  const from = sp.get("from");
  const cat = sp.get("cat");
  const summary = sp.get("summary");

  if (!from && !cat && !summary) return null;

  const fromLabel =
    from === "quick-check" ? "AI 사전 진단" :
    from === "blog" ? "블로그 칼럼" :
    from === "keyword" ? "키워드 가이드" :
    "이전 페이지";
  const catLabel = cat ? PUBLIC_CATEGORY_LABEL[toPublicCategory(cat)] ?? cat : null;

  return (
    <div className="ethos-fadeUp mx-auto mb-6 max-w-3xl rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-bold text-emerald-900">
            {fromLabel}에서 이어졌습니다
          </p>
          {catLabel && (
            <p className="mt-1 text-xs text-emerald-800">
              추정 분야: <span className="font-bold">{catLabel}</span>
              <span className="ml-1 text-emerald-700">— 아래 폼에 입력하시면 함께 검토합니다</span>
            </p>
          )}
          {summary && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-bold text-emerald-900 hover:underline">
                진단 요약 보기
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-white/70 p-3 font-mono text-[11px] leading-5 text-emerald-900">{summary}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export function IntakePrefillBanner() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
