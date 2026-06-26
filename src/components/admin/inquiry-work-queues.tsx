import Link from "next/link";

import { Card } from "@/components/ui/card";

type QueueItem = {
  id: string;
  title: string;
  href: string;
  description: string;
};

type QueueGroup = {
  key: string;
  title: string;
  hint: string;
  tone: "urgent" | "docs" | "consult" | "quote";
  count: number;
  items: QueueItem[];
};

export function InquiryWorkQueuesSafeV2({
  groups
}: {
  groups: QueueGroup[];
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-kicker">Work Queues</p>
          <h3 className="mt-2 ui-section-title">지금 바로 처리할 작업 큐</h3>
        </div>
        <p className="text-sm text-text-muted">
          상세 화면으로 들어가기 전에 어떤 종류의 업무가 몰려 있는지 먼저 빠르게 확인할 수 있습니다.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {groups.map((group) => (
          <Card key={group.key} muted className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={toneClassName(group.tone)} />
                <p className="text-sm font-semibold text-text-strong">{group.title}</p>
              </div>
              <span className="text-lg font-semibold text-text-strong">{group.count}</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">{group.hint}</p>

            <div className="mt-4 space-y-3">
              {group.items.length > 0 ? (
                group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-xl border border-line bg-white px-3 py-3 transition hover:border-line-strong hover:bg-surface"
                  >
                    <p className="truncate whitespace-nowrap text-sm font-medium text-text-strong">{item.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{item.description}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-line px-3 py-4 text-xs text-text-muted">
                  현재 큐에 쌓인 작업이 없습니다.
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function toneClassName(tone: "urgent" | "docs" | "consult" | "quote") {
  if (tone === "urgent") return "h-2.5 w-2.5 rounded-full bg-danger";
  if (tone === "docs") return "h-2.5 w-2.5 rounded-full bg-accent";
  if (tone === "quote") return "h-2.5 w-2.5 rounded-full bg-info";
  return "h-2.5 w-2.5 rounded-full bg-success";
}
