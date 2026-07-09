import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getTopSearchQueries } from "@/lib/services/gsc-service";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { RewriteQueueClient } from "./rewrite-queue-client";

export const dynamic = "force-dynamic";

export default async function BlogRewriteQueuePage() {
  if (!(await isFeatureEnabled("blog_low_ctr_rewrite_queue_page"))) notFound();

  const queries = await getTopSearchQueries(28, 100);
  const gscOk = queries.length > 0;

  const lowCtr = queries
    .filter((q) => q.impressions >= 50 && q.ctr < 0.02)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  const highImpLowClicks = queries
    .filter((q) => q.impressions >= 100 && q.clicks < 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  const lowViewPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { viewCount: "asc" },
    take: 20,
    select: { id: true, title: true, slug: true, viewCount: true, body: true },
  });

  const postsForClient = lowViewPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    viewCount: p.viewCount,
    body: p.body,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Blog Rewrite"
        title="블로그 리라이트 큐"
        description="GSC CTR 하위 쿼리 + 저조회 블로그 글 → 리라이트 우선순위"
      />

      <Card className="p-5">
        <p className="ui-kicker mb-3">저조회 블로그 글 (AI 리라이트)</p>
        {postsForClient.length === 0 ? (
          <p className="text-sm text-text-muted">발행된 블로그 글이 없습니다.</p>
        ) : (
          <RewriteQueueClient posts={postsForClient} />
        )}
      </Card>

      {!gscOk ? (
        <Card className="p-6">
          <p className="text-sm text-text-muted">
            GSC 연동이 설정되지 않았습니다.{" "}
            <Link href="/admin/integrations" className="text-blue-600 underline">
              연동 센터
            </Link>
            에서 Google Search Console 인증을 완료하세요.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <p className="ui-kicker mb-3">저CTR 쿼리 (노출 50↑, CTR 2% 미만)</p>
            {lowCtr.length === 0 ? (
              <p className="text-sm text-text-muted">조건 매칭 쿼리 없음.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-text-muted">
                  <tr>
                    <th className="text-left py-2">쿼리</th>
                    <th className="text-right py-2">노출</th>
                    <th className="text-right py-2">클릭</th>
                    <th className="text-right py-2">CTR</th>
                    <th className="text-right py-2">순위</th>
                  </tr>
                </thead>
                <tbody>
                  {lowCtr.map((q) => (
                    <tr key={q.query} className="border-t border-line">
                      <td className="py-2 truncate max-w-xs">{q.query}</td>
                      <td className="text-right">{q.impressions.toLocaleString()}</td>
                      <td className="text-right">{q.clicks}</td>
                      <td className="text-right text-danger font-medium">
                        {(q.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="text-right">{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-5">
            <p className="ui-kicker mb-3">고노출 저클릭 쿼리 (제목·H1 재작성 후보)</p>
            {highImpLowClicks.length === 0 ? (
              <p className="text-sm text-text-muted">조건 매칭 쿼리 없음.</p>
            ) : (
              <ul className="space-y-2">
                {highImpLowClicks.map((q) => (
                  <li key={q.query} className="flex justify-between border-b border-line py-2 text-sm">
                    <span className="truncate max-w-md">{q.query}</span>
                    <span className="text-xs text-text-muted">
                      노출 {q.impressions.toLocaleString()} · 클릭 {q.clicks} · 순위 {q.position.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
