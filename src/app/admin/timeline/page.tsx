import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  ts: number;
  kind: "payment" | "esign" | "notification" | "case_event" | "tax_invoice";
  title: string;
  detail?: string;
  status?: string;
  caseId?: string | null;
  badgeClass: string;
};

const BADGE: Record<Item["kind"], string> = {
  payment: "bg-emerald-100 text-emerald-800",
  esign: "bg-indigo-100 text-indigo-800",
  notification: "bg-amber-100 text-amber-800",
  case_event: "bg-slate-100 text-slate-700",
  tax_invoice: "bg-violet-100 text-violet-800",
};

const KIND_LABEL: Record<Item["kind"], string> = {
  payment: "결제",
  esign: "전자서명",
  notification: "알림",
  case_event: "사건이벤트",
  tax_invoice: "세금계산서",
};

async function loadTimeline(
  filterKind?: string,
  filterCaseId?: string
): Promise<Item[]> {
  const items: Item[] = [];
  const since = new Date(Date.now() - 30 * 86400_000);

  const [payments, esigns, notifs, events, invoices] = await Promise.all([
    prisma.payment
      .findMany({
        where: { createdAt: { gte: since }, ...(filterCaseId ? { caseId: filterCaseId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.eSignRequest
      .findMany({
        where: { createdAt: { gte: since }, ...(filterCaseId ? { caseId: filterCaseId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.notificationLog
      .findMany({
        where: { createdAt: { gte: since }, ...(filterCaseId ? { caseId: filterCaseId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.caseEvent
      .findMany({
        where: { createdAt: { gte: since }, ...(filterCaseId ? { caseId: filterCaseId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.taxInvoice
      .findMany({
        where: { createdAt: { gte: since }, ...(filterCaseId ? { caseId: filterCaseId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
  ]);

  for (const p of payments) {
    items.push({
      id: `pay-${p.id}`,
      ts: p.createdAt.getTime(),
      kind: "payment",
      title: `${p.orderName} · ${p.amount.toLocaleString("ko-KR")}원`,
      detail: `${p.status} · ${p.orderId}`,
      status: p.status,
      caseId: p.caseId,
      badgeClass: BADGE.payment,
    });
  }
  for (const e of esigns) {
    items.push({
      id: `esign-${e.id}`,
      ts: e.createdAt.getTime(),
      kind: "esign",
      title: `${e.documentTitle} · ${e.signerName}`,
      detail: `${e.status} · ${e.provider}`,
      status: e.status,
      caseId: e.caseId,
      badgeClass: BADGE.esign,
    });
  }
  for (const n of notifs) {
    items.push({
      id: `notif-${n.id}`,
      ts: n.createdAt.getTime(),
      kind: "notification",
      title: `${n.channel} → ${n.recipient}`,
      detail: `${n.status} · ${n.templateId ?? "—"}${n.errorMessage ? ` · ⚠ ${n.errorMessage}` : ""}`,
      status: n.status,
      caseId: n.caseId,
      badgeClass: BADGE.notification,
    });
  }
  for (const ev of events) {
    items.push({
      id: `evt-${ev.id}`,
      ts: ev.createdAt.getTime(),
      kind: "case_event",
      title: ev.message,
      detail: `${ev.eventType}${ev.actorName ? ` · ${ev.actorName}` : ""}`,
      caseId: ev.caseId,
      badgeClass: BADGE.case_event,
    });
  }
  for (const iv of invoices) {
    items.push({
      id: `inv-${iv.id}`,
      ts: iv.createdAt.getTime(),
      kind: "tax_invoice",
      title: `${iv.itemName} · ${iv.totalAmount.toLocaleString("ko-KR")}원`,
      detail: `${iv.status} · ${iv.customerName}${iv.ntsConfirmNum ? ` · NTS ${iv.ntsConfirmNum}` : ""}`,
      status: iv.status,
      caseId: iv.caseId,
      badgeClass: BADGE.tax_invoice,
    });
  }

  items.sort((a, b) => b.ts - a.ts);

  if (filterKind && filterKind !== "all") {
    return items.filter((i) => i.kind === filterKind).slice(0, 200);
  }
  return items.slice(0, 200);
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; caseId?: string }>;
}) {
  const params = await searchParams;
  const items = await loadTimeline(params.kind, params.caseId);

  const counts: Record<string, number> = {};
  for (const i of items) counts[i.kind] = (counts[i.kind] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Audit"
        title="통합 타임라인"
        description="결제 · 전자서명 · 알림 · 사건이벤트 · 세금계산서를 시간순으로 한 화면에 표시. 최근 30일."
      />

      {/* Counts — 모바일 2-3열, 데스크탑 5열 */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-4">
        {(["payment", "esign", "notification", "case_event", "tax_invoice"] as const).map(
          (k) => (
            <Card key={k} className="p-3 md:p-4">
              <p className="text-xs text-text-muted">{KIND_LABEL[k]}</p>
              <p className="mt-1 text-lg md:text-2xl font-semibold tabular-nums">
                {counts[k] ?? 0}
              </p>
            </Card>
          )
        )}
      </div>

      {/* Filter */}
      <Card className="p-4 md:p-6">
        <form className="flex flex-wrap items-center gap-2 text-sm" method="GET">
          <label className="text-text-muted">유형:</label>
          <select
            name="kind"
            defaultValue={params.kind ?? "all"}
            className="rounded border border-line bg-white px-2 py-1"
          >
            <option value="all">전체</option>
            <option value="payment">결제</option>
            <option value="esign">전자서명</option>
            <option value="notification">알림</option>
            <option value="case_event">사건이벤트</option>
            <option value="tax_invoice">세금계산서</option>
          </select>
          <label className="ml-2 text-text-muted">사건 ID:</label>
          <input
            name="caseId"
            defaultValue={params.caseId ?? ""}
            className="rounded border border-line bg-white px-2 py-1 font-mono text-xs"
            placeholder="CaseMatter.id"
          />
          <button
            type="submit"
            className="rounded bg-text-strong px-3 py-1 text-white"
          >
            필터
          </button>
        </form>
      </Card>

      {/* Timeline */}
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-muted">
          최근 30일 활동이 없습니다.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-line">
            {items.map((it) => (
              <li key={it.id} className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${it.badgeClass}`}
                  >
                    {KIND_LABEL[it.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-strong">
                      {it.title}
                    </p>
                    {it.detail && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {it.detail}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>{new Date(it.ts).toLocaleString("ko-KR")}</span>
                      {it.caseId && (
                        <a
                          href={`/admin/timeline?caseId=${it.caseId}`}
                          className="underline"
                        >
                          case {it.caseId.slice(0, 8)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
