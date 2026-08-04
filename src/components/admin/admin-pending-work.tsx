import Link from "next/link";

import { prisma } from "@/lib/prisma/client";
import { listQuestions } from "@/lib/services/community-service";

/**
 * 관리자 홈 상단 "대기 중 작업" 요약 — 승인/응답이 필요한 항목 수를 한눈에.
 * 후기 승인·커뮤니티 답변·신규 문의 처리를 놓치지 않게 한다. 조회 실패는 0.
 */
export async function AdminPendingWork() {
  const [pendingReviews, pendingCommunity, newInquiries] = await Promise.all([
    prisma.testimonial.count({ where: { published: false } }).catch(() => 0),
    listQuestions({ status: "PENDING" })
      .then((r) => r.items.length)
      .catch(() => 0),
    prisma.inquiry.count({ where: { status: "NEW" } }).catch(() => 0),
  ]);

  const items = [
    { label: "신규 문의", count: newInquiries, href: "/admin/inbox", tone: "primary" as const },
    { label: "커뮤니티 답변 대기", count: pendingCommunity, href: "/admin/community", tone: "gold" as const },
    { label: "후기 승인 대기", count: pendingReviews, href: "/admin/testimonials", tone: "emerald" as const },
  ];

  const totalPending = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-strong">대기 중 작업</h2>
        {totalPending === 0 && <span className="text-xs text-emerald-600">✓ 모두 처리됨</span>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm ${
              it.count > 0 ? "border-gold/40 bg-gold-soft/15" : "border-line bg-surface-muted/40"
            }`}
          >
            <span className="text-sm text-text-muted">{it.label}</span>
            <span className={`text-xl font-bold ${it.count > 0 ? "text-primary" : "text-text-muted"}`}>
              {it.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
