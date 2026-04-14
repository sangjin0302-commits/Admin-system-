import Link from "next/link";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { WorkQueuePanel } from "@/components/admin/work-queue-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { listInquiries } from "@/lib/services/inquiry-service";
import { getWorkQueueSnapshot } from "@/lib/work-queue/service";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const session = await requireAdminPageSession("/admin", "STAFF");
  const [inquiries, workQueue] = await Promise.all([listInquiries(), getWorkQueueSnapshot()]);

  const total = inquiries.length;
  const consultation = inquiries.filter(
    (item) => item.status === "CONSULTATION_REQUIRED" || item.status === "WAITING_CONSULTATION"
  ).length;
  const quotePending = inquiries.filter(
    (item) => item.status === "QUOTE_DRAFTED" || item.status === "QUOTE_SENT"
  ).length;
  const won = inquiries.filter((item) => item.status === "WON").length;

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin Home</p>
            <h2 className="mt-2 ui-page-title">운영 대시보드</h2>
            <p className="mt-2 text-sm text-text-muted">
              상담, 견적, 사건, 보완, 기한 상태를 기준으로 오늘 처리할 작업을 한 번에 확인할 수
              있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-muted"
            >
              문의 목록으로 이동
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBox label="전체 문의" value={total} tone="default" />
          <SummaryBox label="상담 대기" value={consultation} tone="warning" />
          <SummaryBox label="견적 후속" value={quotePending} tone="info" />
          <SummaryBox label="수임 진행" value={won} tone="success" />
        </div>
      </Card>

      <WorkQueuePanel snapshot={workQueue} />
    </div>
  );
}

function SummaryBox({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "info" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-lg font-semibold text-text-strong">{value}</p>
        <Badge className={toneClass}>{label}</Badge>
      </div>
    </div>
  );
}
