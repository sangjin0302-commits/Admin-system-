import { prisma } from "@/lib/prisma/client";

import { CaseStoryGenerator } from "./generator";

export const dynamic = "force-dynamic";

export default async function AdminCaseStoryGeneratePage() {
  const closed = await prisma.caseMatter.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      category: true,
      closedAt: true,
      summary: true,
    },
  });

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영 · AI</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">AI 사례 스토리 카드 생성</h2>
      <p className="mt-2 text-sm text-text-muted">
        종결(CLOSED)된 사건을 익명·요약하여 홈페이지 &ldquo;처리 사례&rdquo; 카드로 만들 수 있습니다.
        생성된 결과는 편집 후 &ldquo;게시&rdquo;를 눌러야 실제 노출됩니다.
      </p>

      <div className="mt-6">
        <CaseStoryGenerator
          closedCases={closed.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            closedAt: c.closedAt ? c.closedAt.toISOString() : null,
            summary: c.summary ?? "",
          }))}
        />
      </div>
    </section>
  );
}
