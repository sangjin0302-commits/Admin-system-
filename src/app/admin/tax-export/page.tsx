import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function monthOptions(): Array<{ key: string; label: string }> {
  const now = new Date();
  const out: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` });
  }
  return out;
}

function parseMonth(m: string | undefined): { start: Date; end: Date; key: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    year = y; month = mo - 1;
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start, end, key: `${year}-${String(month + 1).padStart(2, "0")}` };
}

export default async function TaxExportPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  if (!(await isFeatureEnabled("tax_export_csv"))) notFound();

  const sp = (await searchParams) ?? {};
  const { start, end, key } = parseMonth(sp.month);
  const options = monthOptions();

  const rows = await prisma.inquiry.findMany({
    where: { status: "WON", updatedAt: { gte: start, lt: end } },
    select: {
      id: true, title: true, contactName: true, email: true,
      phone: true, intakeChannel: true, createdAt: true, updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
  }).catch(() => []);

  const count = rows.length;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Finance"
        title="세무 CSV 내보내기"
        description="월별 WON 계약 데이터 CSV 다운로드. 부가세 신고·매출 대장 원시자료."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">월</span>
        {options.map((o) => (
          <Link
            key={o.key}
            href={`/admin/tax-export?month=${o.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              key === o.key
                ? "bg-primary text-white"
                : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="ui-kicker">{key} 계약 성사 건수</p>
            <p className="mt-2 text-3xl font-bold text-primary">{count}건</p>
          </div>
          <a
            href={`/api/admin/tax-export?month=${key}`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90"
          >
            CSV 다운로드
          </a>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon="🧾" title={`${key} WON 계약 없음`} description="다른 월을 선택하거나 문의 상태를 WON으로 마킹하세요." action={{ label: "문의 목록", href: "/admin/inquiries" }} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-surface-muted">
              <tr className="text-left">
                <th className="px-4 py-2 font-bold text-text-strong">ID</th>
                <th className="px-4 py-2 font-bold text-text-strong">제목</th>
                <th className="px-4 py-2 font-bold text-text-strong">이름</th>
                <th className="px-4 py-2 font-bold text-text-strong">연락처</th>
                <th className="px-4 py-2 font-bold text-text-strong">채널</th>
                <th className="px-4 py-2 font-bold text-text-strong">접수일</th>
                <th className="px-4 py-2 font-bold text-text-strong">성사일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-mono text-text-muted">{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-text-strong">{r.title || "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{r.contactName || "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{r.phone || r.email || "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{r.intakeChannel || "직접"}</td>
                  <td className="px-4 py-2 text-text-muted">{fmt(r.createdAt)}</td>
                  <td className="px-4 py-2 text-text-muted">{fmt(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
