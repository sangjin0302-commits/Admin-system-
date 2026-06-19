import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, TableContainer } from "@/components/ui/table";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function AutoConversionPage() {
  let recent: Array<{
    id: string;
    createdAt: Date;
    caseId: string;
    inquiryId: string | null;
    message: string;
  }> = [];

  try {
    const rows = await prisma.caseEvent.findMany({
      where: { eventType: "auto_converted" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        caseId: true,
        payloadJson: true,
        message: true,
      },
    });
    recent = rows.map((r) => {
      let inquiryId: string | null = null;
      try {
        const parsed = r.payloadJson ? JSON.parse(r.payloadJson) : null;
        inquiryId = parsed?.inquiryId ?? null;
      } catch {
        /* noop */
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        caseId: r.caseId,
        inquiryId,
        message: r.message,
      };
    });
  } catch (error) {
    console.error("[auto-conversion-page] failed", error);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Automation"
        title="문의 → 사건 자동 전환"
        description="조건을 만족하는 문의를 자동으로 사건(CaseMatter)으로 전환합니다."
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">현재 규칙</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-muted">
          <li>
            <code className="rounded bg-surface-muted px-1">status === &quot;WON&quot;</code>{" "}
            인 문의는 즉시 전환
          </li>
          <li>
            <code className="rounded bg-surface-muted px-1">urgencyLevel ∈ {`{HIGH, CRITICAL}`}</code>{" "}
            이고{" "}
            <code className="rounded bg-surface-muted px-1">qualificationScore ≥ 70</code> 인 경우 전환
          </li>
          <li>이미 연결된 사건이 있는 문의는 건너뜀</li>
        </ul>
      </Card>

      <Card className="p-0">
        <div className="border-b border-line p-4">
          <h2 className="text-sm font-semibold text-text-strong">
            최근 자동 전환 ({recent.length}건)
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="p-4 text-sm text-text-muted">자동 전환 이력이 없습니다.</p>
        ) : (
          <TableContainer className="border-0">
            <Table>
              <thead>
                <tr>
                  <th className="text-left px-4 py-2">시각</th>
                  <th className="text-left px-4 py-2">사건</th>
                  <th className="text-left px-4 py-2">원본 문의</th>
                  <th className="text-left px-4 py-2">메시지</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <Link href={`/admin/cases/${r.caseId}`} className="underline">
                        {r.caseId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {r.inquiryId ? (
                        <Link href={`/admin/inquiries/${r.inquiryId}`} className="underline">
                          {r.inquiryId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-text-muted">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
}
