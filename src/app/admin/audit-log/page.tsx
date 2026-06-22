import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const ACTION_BADGE: Record<string, string> = {
  LOGIN: "bg-emerald-100 text-emerald-800",
  LOGOUT: "bg-slate-100 text-slate-700",
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-indigo-100 text-indigo-800",
  DELETE: "bg-rose-100 text-rose-800",
  EXPORT: "bg-violet-100 text-violet-800",
  PAYMENT_CANCEL: "bg-rose-100 text-rose-800",
  ESIGN_SEND: "bg-indigo-100 text-indigo-800",
  ALIMTALK_SEND: "bg-amber-100 text-amber-800",
  ROLE_CHANGE: "bg-rose-100 text-rose-800",
  CONFIG_CHANGE: "bg-violet-100 text-violet-800",
};

async function loadEvents(
  action?: string,
  actor?: string,
  since?: string,
  until?: string
) {
  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (actor) where.actorEmail = actor;
    const dateRange: Record<string, Date> = {};
    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) dateRange.gte = d;
    }
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        dateRange.lte = d;
      }
    }
    if (Object.keys(dateRange).length > 0) where.createdAt = dateRange;
    return await prisma.adminAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  } catch {
    return [];
  }
}

async function loadStats() {
  try {
    const rows = await prisma.adminAuditEvent.groupBy({
      by: ["action"],
      _count: true,
    });
    return Object.fromEntries(rows.map((r) => [r.action, r._count]));
  } catch {
    return {};
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    actor?: string;
    since?: string;
    until?: string;
  }>;
}) {
  const params = await searchParams;
  const [items, stats] = await Promise.all([
    loadEvents(params.action, params.actor, params.since, params.until),
    loadStats(),
  ]);

  const totalEvents = Object.values(stats).reduce<number>(
    (acc, n) => acc + (typeof n === "number" ? n : 0),
    0
  );

  const csvParams = new URLSearchParams({ format: "csv" });
  if (params.action) csvParams.set("action", params.action);
  if (params.actor) csvParams.set("actor", params.actor);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Audit"
        title="관리자 감사 로그"
        description="모든 SUPER/MANAGER 액션 기록. CSV 다운로드 가능."
        action={
          <a
            href={`/api/admin/audit-log?${csvParams.toString()}`}
            className="rounded border border-line bg-white px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            CSV 다운로드
          </a>
        }
      />

      {/* Top KPI — 모바일 2열 / 데스크탑 4열 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">총 이벤트</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold tabular-nums">
            {totalEvents}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">결제 취소</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold tabular-nums text-rose-700">
            {stats.PAYMENT_CANCEL ?? 0}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">역할 변경</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold tabular-nums">
            {stats.ROLE_CHANGE ?? 0}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">로그인</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold tabular-nums">
            {stats.LOGIN ?? 0}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <form className="flex flex-wrap items-center gap-2 text-sm" method="GET">
          <label className="text-text-muted">액션:</label>
          <select
            name="action"
            defaultValue={params.action ?? ""}
            className="rounded border border-line bg-white px-2 py-1"
          >
            <option value="">전체</option>
            {Object.keys(ACTION_BADGE).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="ml-2 text-text-muted">작성자:</label>
          <input
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="email"
            className="rounded border border-line bg-white px-2 py-1 font-mono text-xs"
          />
          <label className="ml-2 text-text-muted">기간:</label>
          <input
            type="date"
            name="since"
            defaultValue={params.since ?? ""}
            className="rounded border border-line bg-white px-2 py-1 text-xs"
          />
          <span className="text-text-muted">~</span>
          <input
            type="date"
            name="until"
            defaultValue={params.until ?? ""}
            className="rounded border border-line bg-white px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded bg-text-strong px-3 py-1 text-white"
          >
            필터
          </button>
        </form>
      </Card>

      {/* Events */}
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-muted">
          감사 이벤트가 없습니다.
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {items.map((it) => (
              <Card key={it.id} className="p-4">
                <div className="flex items-start gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${ACTION_BADGE[it.action] ?? ""}`}
                  >
                    {it.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {it.resource}
                      {it.resourceId && ` · ${it.resourceId.slice(0, 12)}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {it.actorEmail} ({it.actorRole ?? "—"})
                    </p>
                    {it.details && (
                      <p className="mt-1 line-clamp-2 break-all text-xs text-text-muted">
                        {it.details}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(it.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
                  <tr>
                    <th className="px-5 py-3">시각</th>
                    <th className="px-5 py-3">액션</th>
                    <th className="px-5 py-3">리소스</th>
                    <th className="px-5 py-3">작성자</th>
                    <th className="px-5 py-3">IP</th>
                    <th className="px-5 py-3">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-text-muted">
                        {new Date(it.createdAt).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${ACTION_BADGE[it.action] ?? ""}`}
                        >
                          {it.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {it.resource}
                        {it.resourceId && (
                          <span className="text-text-muted">
                            {" · "}
                            {it.resourceId.slice(0, 12)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {it.actorEmail}
                        <span className="ml-1 text-text-muted">
                          ({it.actorRole ?? "—"})
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-text-muted">
                        {it.ip ?? "—"}
                      </td>
                      <td className="px-5 py-3 max-w-md truncate text-xs text-text-muted">
                        {it.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
