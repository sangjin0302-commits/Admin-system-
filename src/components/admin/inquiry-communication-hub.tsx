"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MessageDraft = {
  id: string;
  label: string;
  description: string;
  content: string;
  badge?: string;
  recommendedWhen?: string;
  channelHint?: string;
};

export function InquiryCommunicationHub({
  drafts,
}: {
  drafts: MessageDraft[];
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
            접수 이후 바로 보낼 수 있는 안내문, 자료 요청문, 상담/견적 안내를 한 곳에서 관리합니다.
          </p>
        </div>
        <Badge>템플릿 묶음</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {drafts.map((draft) => (
          <Card key={draft.id} muted className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-text-strong">{draft.label}</p>
                <p className="mt-1 text-sm text-text-muted">{draft.description}</p>
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
