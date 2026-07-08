import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listActiveVips } from "@/lib/services/vip-membership-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

const AUTO_VIP_THRESHOLD_INQUIRIES = 2;

export default async function VipsPage() {
  if (!(await isFeatureEnabled("vip_auto_tagging"))) notFound();

  const [activeVips, repeatInquirers] = await Promise.all([
    listActiveVips().catch(() => []),
    prisma.inquiry.groupBy({
      by: ["email"],
      where: { status: InquiryStatus.WON, email: { not: "" } },
      _count: { _all: true },
      having: { email: { _count: { gte: AUTO_VIP_THRESHOLD_INQUIRIES } } },
    }).catch(() => [] as Array<{ email: string; _count: { _all: number } }>),
  ]);

  const autoVipEmails = new Set(repeatInquirers.map((r) => r.email));
  const activeVipUserIds = new Set(activeVips.map((v) => v.userId));

  const autoVipDetails = await prisma.inquiry.findMany({
    where: { email: { in: Array.from(autoVipEmails) }, status: InquiryStatus.WON },
    select: { email: true, contactName: true, phone: true, updatedAt: true, title: true },
    orderBy: { updatedAt: "desc" },
  }).catch(() => []);

  const byEmail = new Map<string, { name: string; phone: string | null; count: number; latest: Date; latestTitle: string }>();
  for (const inq of autoVipDetails) {
    const cur = byEmail.get(inq.email);
    if (!cur) {
      byEmail.set(inq.email, { name: inq.contactName, phone: inq.phone, count: 1, latest: inq.updatedAt, latestTitle: inq.title });
    } else {
      cur.count += 1;
      if (inq.updatedAt > cur.latest) {
        cur.latest = inq.updatedAt;
        cur.latestTitle = inq.title;
      }
    }
  }

  const autoRows = Array.from(byEmail.entries()).sort((a, b) => b[1].count - a[1].count);
  const fmt = (d: Date) => d.toLocaleDateString("ko-KR");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="CRM"
        title="VIP 리스트"
        description="구독형 VIP 회원 + 재의뢰 2회+ 자동 태깅 고객."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">활성 구독 VIP</p>
          <p className="mt-2 text-3xl font-bold text-primary">{activeVips.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">자동 태깅 (재의뢰 2+)</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{autoRows.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">VIP 총 관리 대상</p>
          <p className="mt-2 text-3xl font-bold text-primary">{activeVipUserIds.size + autoRows.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="ui-kicker">구독형 VIP (월 결제 활성)</p>
        {activeVips.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">활성 구독자 없음.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">User ID</th>
                  <th className="pb-2 font-bold text-text-strong">Plan</th>
                  <th className="pb-2 font-bold text-text-strong">시작일</th>
                  <th className="pb-2 font-bold text-text-strong">만료일</th>
                </tr>
              </thead>
              <tbody>
                {activeVips.map((v) => (
                  <tr key={v.userId} className="border-b border-gold/10">
                    <td className="py-2 font-mono text-text-muted">{v.userId.slice(0, 12)}</td>
                    <td className="py-2 font-bold text-primary">{v.plan}</td>
                    <td className="py-2 text-text-muted">{fmt(new Date(v.startedAt))}</td>
                    <td className="py-2 text-text-muted">{fmt(new Date(v.expiresAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">자동 태깅 (재의뢰 {AUTO_VIP_THRESHOLD_INQUIRIES}회+ 계약 완료)</p>
        <p className="mt-1 text-xs text-text-muted">같은 이메일로 2건 이상 WON 완료 — 응대 우선순위 상향, 계약가 자동 할인 후보</p>
        {autoRows.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 재의뢰 고객 없음.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">이름</th>
                  <th className="pb-2 font-bold text-text-strong">이메일</th>
                  <th className="pb-2 font-bold text-text-strong">연락처</th>
                  <th className="pb-2 text-right font-bold text-text-strong">계약 건</th>
                  <th className="pb-2 font-bold text-text-strong">최근 계약</th>
                </tr>
              </thead>
              <tbody>
                {autoRows.map(([email, v]) => (
                  <tr key={email} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text-strong">{v.name}</td>
                    <td className="py-2 font-mono text-text-muted">{email}</td>
                    <td className="py-2 text-text-muted">{v.phone ?? "—"}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">{v.count}회</td>
                    <td className="py-2 text-text-muted">{fmt(v.latest)} · {v.latestTitle.slice(0, 24)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">활용 팁</p>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>• 자동 태깅 고객 신규 문의 시 응대 우선순위 상향 (24h → 4h SLA)</li>
          <li>• 재의뢰 시 5-10% 자동 할인 (계약가 500만+ 협의)</li>
          <li>• <Link href="/admin/features" className="text-gold-deep hover:underline">/admin/features</Link>에서 <code>vip_concierge_bot</code> 켜면 24/7 AI 컨시어지 활성</li>
        </ul>
      </Card>
    </div>
  );
}
