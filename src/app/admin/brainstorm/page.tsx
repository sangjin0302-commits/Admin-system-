import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";

import { BrainstormClient } from "./brainstorm-client";

export const dynamic = "force-dynamic";

export default async function BrainstormPage() {
  const cases = await prisma.caseMatter.findMany({
    select: { id: true, title: true, caseNo: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Strategy"
        title="AI 브레인스토밍"
        description="난이도 높은 사건에 대해 AI와 대화하며 전략을 탐색합니다."
      />
      <BrainstormClient cases={cases.map((c) => ({ id: c.id, label: `${c.title} (${c.caseNo ?? "-"})` }))} />
    </div>
  );
}
