"use client";

import { useState, useTransition } from "react";

import { Card } from "@/components/ui/card";

interface ScriptSections {
  greeting: string;
  situationQuestions: string[];
  quoteBriefing: string;
  nextSteps: string;
  closing: string;
  provider: "claude-haiku" | "fallback";
}

async function copyText(text: string): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // ignore clipboard failures
  }
}

function ScriptSection({
  title,
  body,
  onCopy
}: {
  title: string;
  body: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-white/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="ui-kicker">{title}</p>
        <button
          type="button"
          className="text-xs font-medium text-primary underline decoration-dotted underline-offset-2"
          onClick={onCopy}
        >
          복사하기
        </button>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-text-strong">{body || "-"}</p>
    </div>
  );
}

export function ConsultationScriptPanel({ inquiryId }: { inquiryId: string }) {
  const [open, setOpen] = useState(false);
  const [script, setScript] = useState<ScriptSections | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/inquiries/${inquiryId}/consultation-script`, {
          method: "POST"
        });
        const data = (await res.json()) as { ok?: boolean; script?: ScriptSections; message?: string };
        if (!res.ok || !data.ok || !data.script) {
          throw new Error(data.message ?? "상담 대본을 생성하지 못했습니다.");
        }
        setScript(data.script);
      } catch (e) {
        setError(e instanceof Error ? e.message : "상담 대본을 생성하지 못했습니다.");
      }
    });
  };

  const markCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
  };

  const fullText = script
    ? [
        `[인사]\n${script.greeting}`,
        `[상황 파악 질문]\n${script.situationQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        `[견적 안내]\n${script.quoteBriefing}`,
        `[다음 단계]\n${script.nextSteps}`,
        `[마무리]\n${script.closing}`
      ].join("\n\n")
    : "";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">상담 대본 자동 생성</p>
          <p className="mt-1 text-sm text-text-muted">
            문의 요약과 카테고리를 근거로 상담용 Q&amp;A 대본(인사·질문 5개·견적·다음 단계·마무리)을 생성합니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border/60 px-3 py-1 text-xs font-medium hover:bg-black/5"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "접기" : "펼치기"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? "생성 중…" : script ? "다시 생성" : "대본 생성"}
            </button>
            {script && (
              <button
                type="button"
                className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                onClick={async () => {
                  await copyText(fullText);
                  markCopied("all");
                }}
              >
                {copiedKey === "all" ? "복사됨" : "전체 복사"}
              </button>
            )}
            {script && (
              <span className="text-xs text-text-muted">
                생성 엔진: {script.provider === "claude-haiku" ? "Claude Haiku" : "기본 템플릿"}
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          {script && (
            <div className="space-y-2">
              <ScriptSection
                title="인사"
                body={script.greeting}
                onCopy={async () => {
                  await copyText(script.greeting);
                  markCopied("greeting");
                }}
              />
              <div className="rounded-md border border-border/60 bg-white/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="ui-kicker">상황 파악 질문</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline decoration-dotted underline-offset-2"
                    onClick={async () => {
                      await copyText(
                        script.situationQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
                      );
                      markCopied("questions");
                    }}
                  >
                    {copiedKey === "questions" ? "복사됨" : "복사하기"}
                  </button>
                </div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-strong">
                  {script.situationQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>
              <ScriptSection
                title="견적 안내"
                body={script.quoteBriefing}
                onCopy={async () => {
                  await copyText(script.quoteBriefing);
                  markCopied("quote");
                }}
              />
              <ScriptSection
                title="다음 단계"
                body={script.nextSteps}
                onCopy={async () => {
                  await copyText(script.nextSteps);
                  markCopied("next");
                }}
              />
              <ScriptSection
                title="마무리"
                body={script.closing}
                onCopy={async () => {
                  await copyText(script.closing);
                  markCopied("closing");
                }}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
