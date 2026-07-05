import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import {
  getSyndication,
  CHANNEL_LABEL,
  CHANNEL_ORDER,
} from "@/lib/services/pr-syndication-service";
import { PrDistributionList } from "./pr-distribution-list";

export const dynamic = "force-dynamic";

export default async function AdminPrDistributionPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      category: true,
    },
  });
  const records = await Promise.all(posts.map((p) => getSyndication(p.id)));

  const items = posts.map((p, i) => ({
    post: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      category: p.category,
    },
    syndication: records[i],
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="PR"
        title="PR 자동 배포"
        description="블로그 발행 시 자동 생성된 채널별 문안을 확인하고 재생성/게시합니다. 실제 게시는 아직 수동 복사입니다 (OAuth 연동은 TODO)."
      />

      <Card className="p-4 text-xs text-text-muted">
        <p className="font-semibold text-text-strong">채널</p>
        <p className="mt-1">
          {CHANNEL_ORDER.map((c) => CHANNEL_LABEL[c]).join(" · ")}
        </p>
        <p className="mt-2">
          자동 생성은 기능 플래그 <code className="rounded bg-surface-muted px-1">pr_syndication</code>{" "}
          이 켜져 있을 때만 발행 시 트리거됩니다.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          발행된 블로그 글이 없습니다.
        </Card>
      ) : (
        <PrDistributionList items={items} />
      )}
    </div>
  );
}
