import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

async function loadB2BAccounts() {
  const inquiries = await prisma.inquiry.findMany({
    where: { intakeSource: "b2b" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Aggregate by organization name
  const byOrg = new Map<
    string,
    { org: string; total: number; closed: number; inProgress: number; revenue: number }
  >();
  for (const q of inquiries) {
    const org = q.organizationName ?? "(미기재)";
    if (!byOrg.has(org)) {
      byOrg.set(org, { org, total: 0, closed: 0, inProgress: 0, revenue: 0 });
    }
    const row = byOrg.get(org)!;
    row.total += 1;
    if (q.status === "CLOSED") row.closed += 1;
    else row.inProgress += 1;
  }

  return {
    inquiries,
    accounts: Array.from(byOrg.values()),
  };
}

export default async function AdminB2BPage() {
  const { inquiries, accounts } = await loadB2BAccounts();
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Enterprise</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">B2B 계정 대시보드</h2>
      <p className="mt-2 text-sm text-text-muted">
        `intakeSource=b2b` 로 접수된 문의를 회사별로 집계합니다.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-3 py-2">회사</th>
              <th className="px-3 py-2 text-right">총 문의</th>
              <th className="px-3 py-2 text-right">진행 중</th>
              <th className="px-3 py-2 text-right">완료</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.org} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{a.org}</td>
                <td className="px-3 py-2 text-right">{a.total}</td>
                <td className="px-3 py-2 text-right">{a.inProgress}</td>
                <td className="px-3 py-2 text-right">{a.closed}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                  B2B 문의가 아직 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 text-base font-bold text-text-strong">최근 B2B 문의</h3>
      <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
        {inquiries.slice(0, 20).map((q) => (
          <li key={q.id} className="px-3 py-2 text-sm">
            <p className="font-semibold">
              {q.organizationName} · {q.contactName}
            </p>
            <p className="text-xs text-text-muted">
              {new Date(q.createdAt).toLocaleString()} · {q.status} · {q.email}
            </p>
          </li>
        ))}
        {inquiries.length === 0 && (
          <li className="px-3 py-6 text-center text-text-muted">문의 내역 없음</li>
        )}
      </ul>
    </section>
  );
}
