"use client";

import type { PrescreenResult } from "@/lib/services/intake-prescreen-service";

interface PrescreenResultCardProps {
  result: PrescreenResult;
}

const URGENCY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-red-100", text: "text-red-800", label: "긴급" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", label: "보통" },
  low: { bg: "bg-green-100", text: "text-green-800", label: "일반" },
};

export default function PrescreenResultCard({ result }: PrescreenResultCardProps) {
  const urgency = URGENCY_STYLES[result.urgencyLevel] ?? URGENCY_STYLES.low;

  return (
    <div className="ethos-card border border-amber-200 bg-white rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${urgency.bg} ${urgency.text}`}
        >
          {urgency.label}
        </span>
        <span className="text-sm text-gray-500">
          예상 회신: <strong className="text-amber-700">{result.estimatedResponseTime}</strong>
        </span>
      </div>

      {/* Note */}
      <p className="text-gray-700 text-sm leading-relaxed">{result.briefNote}</p>

      {/* Channel buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {result.suggestedChannel === "kakao" ? (
          <>
            <a
              href="https://pf.kakao.com/_your_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#FEE500] text-[#3C1E1E] font-bold text-sm hover:opacity-90 transition-colors"
            >
              카카오톡으로 빠른 상담
            </a>
            <a
              href="mailto:contact@ethos.kr"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors"
            >
              이메일로 상세 검토 요청
            </a>
          </>
        ) : (
          <>
            <a
              href="mailto:contact@ethos.kr"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-amber-600 text-white font-bold text-sm hover:opacity-90 transition-colors"
            >
              이메일로 상세 검토 요청
            </a>
            <a
              href="https://pf.kakao.com/_your_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors"
            >
              카카오톡으로 빠른 상담
            </a>
          </>
        )}
      </div>
    </div>
  );
}
