"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function QuoteShortcutBar() {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>작업 바로가기</Badge>
        <a
          href="#quote-analysis"
          className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
        >
          사건 분석 보기
        </a>
        <a
          href="#quote-contract"
          className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
        >
          계약 초안으로 이동
        </a>
        <a
          href="#quote-messages"
          className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
        >
          안내 문구 보기
        </a>
      </div>
    </Card>
  );
}
