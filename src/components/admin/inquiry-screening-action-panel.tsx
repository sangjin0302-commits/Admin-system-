"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateInline } from "@/components/ui/state-panel";
import type { InquiryScreeningResult } from "@/lib/intake-screening/service";
import { inquiryStatusLabels, type InquiryStatus } from "@/types/inquiry";

export function InquiryScreeningActionPanel({
  inquiryId,
  screening,
  canApplyStatus
}: {
  inquiryId: string;
  screening: InquiryScreeningResult;
  canApplyStatus: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"default" | "error" | "success">("default");
  const [isPending, startTransition] = useTransition();

  async function handleApplyStatus(status: InquiryStatus) {
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "추천 상태 반영 중 오류가 발생했습니다.");
        return;
      }

      setMessageTone("success");
      setMessage(`${inquiryStatusLabels[status].ko} 상태로 반영했습니다.`);
      router.refresh();
    });
  }

  async function handleCopyClientMessage() {
    try {
      await navigator.clipboard.writeText(screening.clientMessageDraft);
      setMessageTone("success");
      setMessage("고객 안내 문구를 클립보드에 복사했습니다.");
    } catch {
      setMessageTone("error");
      setMessage("클립보드 복사에 실패했습니다.");
    }
  }

  return (
    <Card muted className="mt-5 p-5">
      <p className="ui-kicker">실행 가이드</p>
      <div className="mt-3 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-strong">추천 운영 경로</p>
            <p className="mt-2 text-sm leading-6 text-text">{screening.summary}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canApplyStatus ? (
              <Button
                size="sm"
                onClick={() => handleApplyStatus(screening.suggestedStatus)}
                disabled={isPending}
              >
                {isPending ? "반영 중..." : screening.statusActionLabel}
              </Button>
            ) : null}
            <Link href={screening.actionHref} className="ui-toolbar-button px-4 py-2 text-sm">
              {screening.actionLabel}
            </Link>
            {screening.secondaryActionHref && screening.secondaryActionLabel ? (
              <Link href={screening.secondaryActionHref} className="ui-toolbar-button px-4 py-2 text-sm">
                {screening.secondaryActionLabel}
              </Link>
            ) : null}
            <Button size="sm" variant="secondary" onClick={handleCopyClientMessage}>
              고객 안내 문구 복사
            </Button>
          </div>

          {message ? <StateInline tone={messageTone}>{message}</StateInline> : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-text-strong">운영 체크리스트</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text">
            {screening.opsChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
