"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerNotificationManualAuditCard } from "@/components/admin/customer-notification-manual-audit-card";
import { CustomerNotificationPreviewCard } from "@/components/admin/customer-notification-preview-card";
import { CustomerTrackingNoticeCopyCard } from "@/components/admin/customer-tracking-notice-copy-card";

export type InquiryCommunicationDraft = {
  id: string;
  label: string;
  description: string;
  content: string;
  badge?: string;
  recommendedWhen?: string;
  channelHint?: string;
};

export function InquiryCommunicationCenterV2({
  inquiryId,
  drafts,
  recommendedDraftIds = [],
  recommendationLabel,
  publicTrackingCode = null
}: {
  inquiryId: string;
  drafts: InquiryCommunicationDraft[];
  recommendedDraftIds?: string[];
  recommendationLabel?: string;
  publicTrackingCode?: string | null;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bundleCopied, setBundleCopied] = useState(false);
  const [focusedDraftId, setFocusedDraftId] = useState<string | null>(null);
  const recommendedSet = new Set(recommendedDraftIds);
  const orderedDrafts = [
    ...drafts.filter((draft) => recommendedSet.has(draft.id)),
    ...drafts.filter((draft) => !recommendedSet.has(draft.id))
  ];
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const focusDraftId = window.sessionStorage.getItem("lawbot-focus-draft-id");
    if (!focusDraftId) return;

    window.sessionStorage.removeItem("lawbot-focus-draft-id");
    setFocusedDraftId(focusDraftId);
    cardRefs.current[focusDraftId]?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeoutId = window.setTimeout(() => setFocusedDraftId(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [drafts]);

  async function copyDraft(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  async function copyRecommendedBundle() {
    const recommendedDrafts = orderedDrafts.filter((draft) => recommendedSet.has(draft.id));
    if (recommendedDrafts.length === 0) {
      setBundleCopied(false);
      return;
    }

    const bundleText = recommendedDrafts
      .map((draft) => [`[${draft.label}]`, draft.content].join("\n"))
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(bundleText);
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 1500);
    } catch {
      setBundleCopied(false);
    }
  }

  return (
    <Card className="p-6" id="communication-center">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {recommendationLabel ? (
            <p className="mb-2 text-xs font-medium text-emerald-700">현재 추천 경로: {recommendationLabel}</p>
          ) : null}
          <h3 className="ui-section-title">고객 커뮤니케이션 허브</h3>
          <p className="mt-2 text-sm text-text-muted">
            접수 직후 안내부터 상담, 자료 요청, 견적 연결까지 바로 보낼 수 있는 문안을 한곳에서 관리합니다.
          </p>
        </div>
        <Badge>실무 템플릿</Badge>
      </div>

      <CustomerTrackingNoticeCopyCard trackingCode={publicTrackingCode} />
      <CustomerNotificationPreviewCard inquiryId={inquiryId} />
      <CustomerNotificationManualAuditCard inquiryId={inquiryId} />

      {recommendedDraftIds.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">추천 문안 묶음</p>
            <p className="mt-1 text-xs text-text-muted">현재 추천 경로와 맞는 문안을 한 번에 복사할 수 있습니다.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void copyRecommendedBundle()}>
            {bundleCopied ? "추천 묶음 복사됨" : "추천 문안 묶음 복사"}
          </Button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {orderedDrafts.map((draft) => (
          <div
            key={draft.id}
            className={focusedDraftId === draft.id ? "rounded-2xl ring-2 ring-emerald-300 ring-offset-2" : ""}
            ref={(node: HTMLDivElement | null) => {
              cardRefs.current[draft.id] = node;
            }}
          >
            <Card
              muted
              className={`p-5 ${recommendedSet.has(draft.id) ? "border-emerald-200 bg-emerald-50/60" : ""}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-strong">{draft.label}</p>
                  <p className="mt-1 text-sm text-text-muted">{draft.description}</p>
                  {draft.recommendedWhen ? (
                    <p className="mt-2 text-xs font-medium text-text-muted">권장 시점: {draft.recommendedWhen}</p>
                  ) : null}
                  {draft.channelHint ? (
                    <p className="mt-1 text-xs text-text-muted">권장 채널: {draft.channelHint}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {focusedDraftId === draft.id ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">지금 확인</Badge>
                  ) : null}
                  {recommendedSet.has(draft.id) ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">추천 문안</Badge>
                  ) : null}
                  {draft.badge ? <Badge>{draft.badge}</Badge> : null}
                  <Button
                    size="sm"
                    variant={recommendedSet.has(draft.id) ? "primary" : "secondary"}
                    onClick={() => void copyDraft(draft.id, draft.content)}
                  >
                    {copiedId === draft.id ? "복사됨" : "문안 복사"}
                  </Button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text">{draft.content}</p>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
}
