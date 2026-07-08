import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 활동 · ETHOS 관리" };

type ActivityEvent = {
  id: string;
  when: Date;
  kind: "inquiry" | "case" | "blog";
  title: string;
  detail: string;
  href: string;
};

function timeAgo(when: Date): string {
  const ms = Date.now() - when.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return when.toLocaleDateString("ko-KR");
}

export default async function MyActivityPage() {
  if (!(await isFeatureEnabled("my_activity_timeline"))) notFound();

  const [inquiries, cases, blogs] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, updatedAt: true, title: true, status: true, contactName: true },
    }).catch(() => []),
    prisma.caseMatter.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, updatedAt: true, title: true, status: true, caseNo: true },
    }).catch(() => []),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { slug: true, updatedAt: true, title: true, category: true },
    }).catch(() => []),
  ]);

  const events: ActivityEvent[] = [
    ...inquiries.map((i) => ({
      id: `inq-${i.id}`,
      when: i.updatedAt,
      kind: "inquiry" as const,
      title: i.title,
      detail: `${i.contactName ?? "미상"} · ${i.status}`,
      href: `/admin/inquiries/${i.id}`,
    })),
    ...cases.map((c) => ({
      id: `case-${c.id}`,
      when: c.updatedAt,
      kind: "case" as const,
      title: c.title,
      detail: `${c.caseNo ?? c.id.slice(0, 8)} · ${c.status}`,
      href: `/admin/cases/${c.id}`,
    })),
    ...blogs.map((b) => ({
      id: `blog-${b.slug}`,
      when: b.updatedAt,
      kind: "blog" as const,
      title: b.title,
      detail: b.category,
      href: `/blog/${b.slug}`,
    })),
  ]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 40);

  const KIND_ICON: Record<ActivityEvent["kind"], string> = {
    inquiry: "📥",
    case: "📂",
    blog: "📝",
  };

  const today = new Date().toLocaleDateString("ko-KR");
  const todayCount = events.filter((e) => e.when.toLocaleDateString("ko-KR") === today).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">내 활동 timeline</h1>
        <p className="mt-1 text-sm text-text-muted">
          최근 문의·사건·블로그 변경사항 통합 timeline. 오늘 <b>{todayCount}건</b>.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">활동 기록 없음</div>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-3 hover:bg-surface-muted">
                <span className="text-lg">{KIND_ICON[e.kind]}</span>
                <div className="flex-1 min-w-0">
                  <Link href={e.href} className="text-sm font-medium text-text hover:text-primary line-clamp-1">
                    {e.title}
                  </Link>
                  <p className="text-[11px] text-text-muted">{e.detail}</p>
                </div>
                <span className="text-[11px] text-text-muted whitespace-nowrap">{timeAgo(e.when)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
