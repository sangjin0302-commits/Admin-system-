"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  drafts,
}: {
  drafts: InquiryCommunicationDraft[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyDraft(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="ui-section-title">고객 커뮤니케이션 허브</h3>
          <p className="mt-2 text-sm text-text-muted">
            접수 이후 바로 보낼 수 있는 안내문, 자료 요청문, 상담 및 견적 연결 문안을 한곳에서 관리합니다.
          </p>
        </div>
        <Badge>실무 템플릿</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {drafts.map((draft) => (
          <Card key={draft.id} muted className="p-5">
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
                {draft.badge ? <Badge>{draft.badge}</Badge> : null}
                <Button size="sm" variant="secondary" onClick={() => void copyDraft(draft.id, draft.content)}>
                  {copiedId === draft.id ? "복사됨" : "복사"}
                </Button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text">{draft.content}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
}
