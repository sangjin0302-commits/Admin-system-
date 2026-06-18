import Link from "next/link";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const KRW = new Intl.NumberFormat("ko-KR");

export default async function AdminCrmPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";

  /* ── fetch all inquiries with linked case matters ── */
  const inquiries = await prisma.inquiry.findMany({
    select: {
      id: true,
      contactName: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      latestContactAt: true,
      status: true,
      caseMatters: {
        select: {
          id: true,
          accountingMemo: {
            select: { feeAmount: true, paidAmount: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  /* ── group by email (primary customer key) ── */
  type CustomerRow = {
    email: string;
    name: string;
    phone: string | null;
    inquiryCount: number;
    caseCount: number;
    totalRevenue: number;
    lastContactAt: Date;
    inquiryIds: string[];
  };

  const map = new Map<string, CustomerRow>();

  for (const inq of inquiries) {
    const key = inq.email.toLowerCase();
    let row = map.get(key);

    const caseCount = inq.caseMatters.length;
    const revenue = inq.caseMatters.reduce((sum, cm) => {
      return sum + (cm.accountingMemo?.paidAmount ?? 0);
    }, 0);
    const contactDate = inq.latestContactAt ?? inq.updatedAt;

    if (!row) {
      row = {
        email: inq.email,
        name: inq.contactName,
        phone: inq.phone ?? null,
        inquiryCount: 0,
        caseCount: 0,
        totalRevenue: 0,
        lastContactAt: contactDate,
        inquiryIds: []
      };
      map.set(key, row);
    }

    row.inquiryCount += 1;
    row.caseCount += caseCount;
    row.totalRevenue += revenue;
    if (contactDate > row.lastContactAt) {
      row.lastContactAt = contactDate;
    }
    row.inquiryIds.push(inq.id);
    // prefer the most recent name/phone if available
    if (inq.contactName) row.name = inq.contactName;
    if (inq.phone) row.phone = inq.phone;
  }

  let customers = Array.from(map.values()).sort(
    (a, b) => b.lastContactAt.getTime() - a.lastContactAt.getTime()
  );

  /* ── search filter ── */
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <Card className="p-6">
        <p className="ui-kicker">Customer CRM</p>
        <h2 className="mt-2 ui-page-title">고객 관리</h2>
        <p className="mt-2 text-sm text-text-muted">
          고객별 문의·사건 현황과 매출을 한눈에 확인합니다.
        </p>
      </Card>

      {/* search */}
      <Card className="p-4">
        <form method="GET" className="flex items-center gap-3">
          <input
            type="text"
            name="q"
            placeholder="이름, 이메일, 전화번호로 검색..."
            defaultValue={search}
            className="flex-1 rounded-md border border-border bg-bg-base px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            검색
          </button>
          {search && (
            <Link
              href="/admin/crm"
              className="text-sm text-text-muted hover:text-text-default"
            >
              초기화
            </Link>
          )}
        </form>
      </Card>

      {/* table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">고객명</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">전화</th>
                <th className="px-4 py-3 text-center">문의</th>
                <th className="px-4 py-3 text-center">사건</th>
                <th className="px-4 py-3 text-right">매출</th>
                <th className="px-4 py-3 text-right">최근 연락</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    {search ? "검색 결과가 없습니다." : "등록된 고객이 없습니다."}
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.email} className="hover:bg-bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/crm/${encodeURIComponent(c.email)}`}
                      className="text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.email}</td>
                  <td className="px-4 py-3 text-text-muted">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{c.inquiryCount}</td>
                  <td className="px-4 py-3 text-center">{c.caseCount}</td>
                  <td className="px-4 py-3 text-right">
                    {c.totalRevenue > 0 ? `${KRW.format(c.totalRevenue)}원` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {c.lastContactAt.toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-xs text-text-muted">
            총 {customers.length}명의 고객
          </div>
        )}
      </Card>
    </div>
  );
}
