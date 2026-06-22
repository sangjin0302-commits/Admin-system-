import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isAlimtalkConnected } from "@/lib/services/kakao-notification-service";

export const dynamic = "force-dynamic";

const CHANNEL_LABEL: Record<string, string> = {
  ALIMTALK: "알림톡",
  SMS: "SMS",
  EMAIL: "이메일",
  PUSH: "푸시",
};

const STATUS_BADGE: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  SKIPPED: "bg-amber-100 text-amber-800",
  QUEUED: "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "발송됨",
  FAILED: "실패",
  SKIPPED: "건너뜀",
  QUEUED: "대기",
};

async function loadNotifications(channel?: string, status?: string) {
  try {
    const where: Record<string, unknown> = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;
    return await prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    return [];
  }
}

async function loadStats() {
  try {
    const rows = await prisma.notificationLog.groupBy({
      by: ["status"],
      _count: true,
    });
    return Object.fromEntries(rows.map((r) => [r.status, r._count]));
  } catch {
    return {};
  }
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [items, stats] = await Promise.all([
    loadNotifications(params.channel, params.status),
    loadStats(),
  ]);
  const connected = isAlimtalkConnected();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Notifications"
        title="알림 발송 이력"
        description="알림톡 / SMS / 이메일 / 푸시 발송 audit trail. 실패 사유 및 SKIPPED 원인 확인용."
      />

      {/* KPI cards — 모바일 2열 / 데스크탑 4열 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">연동 상태</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "Solapi 연결" : "미설정"}
            </span>
          </div>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">발송 성공</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-emerald-700 tabular-nums">
            {stats.SENT ?? 0}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">실패</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-rose-700 tabular-nums">
            {stats.FAILED ?? 0}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">건너뜀</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-amber-700 tabular-nums">
            {stats.SKIPPED ?? 0}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <form className="flex flex-wrap items-center gap-2 text-sm" method="GET">
          <label className="text-text-muted">채널:</label>
          <select
            name="channel"
            defaultValue={params.channel ?? ""}
            className="rounded border border-line bg-white px-2 py-1"
          >
            <option value="">전체</option>
            <option value="ALIMTALK">알림톡</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">이메일</option>
            <option value="PUSH">푸시</option>
          </select>
          <label className="ml-2 text-text-muted">상태:</label>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded border border-line bg-white px-2 py-1"
          >
            <option value="">전체</option>
            <option value="SENT">발송됨</option>
            <option value="FAILED">실패</option>
            <option value="SKIPPED">건너뜀</option>
            <option value="QUEUED">대기</option>
          </select>
          <button
            type="submit"
            className="rounded bg-text-strong px-3 py-1 text-white"
          >
            필터
          </button>
        </form>
      </Card>

      {/* List — 모바일: 카드 / 데스크탑: 테이블 */}
      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-muted">
          발송 이력이 없습니다.
        </Card>
      ) : (
        <>
          {/* 모바일 카드 뷰 */}
          <div className="space-y-2 md:hidden">
            {items.map((it) => (
              <Card key={it.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-strong">
                      {CHANNEL_LABEL[it.channel]} · {it.recipient}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {it.templateId ?? "—"}
                    </p>
                    {it.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {it.body}
                      </p>
                    )}
                    {it.errorMessage && (
                      <p className="mt-1 text-xs text-rose-700">
                        ⚠ {it.errorMessage}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[it.status] ?? ""}`}
                  >
                    {STATUS_LABEL[it.status] ?? it.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {new Date(it.createdAt).toLocaleString("ko-KR")}
                </p>
              </Card>
            ))}
          </div>

          {/* 데스크탑 테이블 뷰 */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
                  <tr>
                    <th className="px-5 py-3">시각</th>
                    <th className="px-5 py-3">채널</th>
                    <th className="px-5 py-3">수신자</th>
                    <th className="px-5 py-3">템플릿</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-text-muted">
                        {new Date(it.createdAt).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-5 py-3">{CHANNEL_LABEL[it.channel]}</td>
                      <td className="px-5 py-3 font-mono text-xs">{it.recipient}</td>
                      <td className="px-5 py-3 text-text-muted">
                        {it.templateId ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[it.status] ?? ""}`}
                        >
                          {STATUS_LABEL[it.status] ?? it.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-md truncate text-xs text-text-muted">
                        {it.errorMessage ?? it.body ?? "—"}
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
