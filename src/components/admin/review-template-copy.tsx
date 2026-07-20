"use client";

import { useState } from "react";

const TEMPLATE = `안녕하세요, 행정사 지상진입니다.

[검토 결과]
→ [가능 / 추가 확인 필요 / 에토스 업무 범위 외]
→ 견적 범위: [해당 시 안내]

구체적인 전략·서류 설계·리스크 분석은 유료 상담에서 진행합니다.
상담료는 문의 주시면 안내드리며, 수임 시 전액 차감됩니다.

— ETHOS 행정사사무소`;

const TEMPLATE_EN = `Hello, this is Jean from ETHOS Administrative Attorney Office.

[Review Result]
→ [Feasible / Needs further verification / Out of ETHOS scope]
→ Estimated fee range: [if applicable]

Strategy, document design, and risk analysis are handled in paid consultation.
Consultation fee will be credited in full upon engagement.

— ETHOS Administrative Attorney Office`;

const TEMPLATE_AR = `السلام عليكم، أنا جين من مكتب ETHOS للإجراءات الإدارية.

[نتيجة المراجعة]
→ [ممكن / يحتاج تحقق إضافي / خارج نطاق ETHOS]
→ نطاق الرسوم: [إن وجد]

الاستراتيجية وتصميم الوثائق وتحليل المخاطر تُجرى في الاستشارة المدفوعة.
تُخصم رسوم الاستشارة بالكامل عند التوكيل.

— ETHOS مكتب الإجراءات الإدارية`;

export function ReviewTemplateCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState<"ko" | "en" | "ar">("ko");

  const text = lang === "ko" ? TEMPLATE : lang === "en" ? TEMPLATE_EN : TEMPLATE_AR;

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(lang);
      window.setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="rounded-lg border border-gold/30 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-serif text-sm font-bold text-primary">v4.8 검토 응답 템플릿</p>
        <div className="flex gap-1">
          {(["ko", "en", "ar"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded px-2 py-0.5 text-[11px] font-bold ${lang === l ? "bg-primary text-white" : "border border-line bg-surface text-text-muted"}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-surface-muted/40 p-3 font-mono text-xs leading-6 text-text" dir={lang === "ar" ? "rtl" : "ltr"}>{text}</pre>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-text-strong"
        >
          {copied === lang ? "✓ 복사됨" : "클립보드에 복사"}
        </button>
        <span className="text-[11px] text-text-muted">모든 채널(톡톡·카카오·이메일·텔레그램) 동일 사용</span>
      </div>
    </div>
  );
}
