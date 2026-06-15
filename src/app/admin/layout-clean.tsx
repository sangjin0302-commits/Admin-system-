import Link from "next/link";

import { AdminOpsBanner } from "@/components/admin/admin-ops-banner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-line bg-surface px-5 py-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">관리자 업무 공간</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text-strong">
              행정사 업무 관리 허브
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              문의 접수부터 상담, 견적, 사건 진행, 분석 연동 준비 상태까지 한 곳에서 보는 관리자 화면입니다.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              대시보드
            </Link>
            <Link
              href="/admin/search"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              통합 검색
            </Link>
            <Link
              href="/admin/inquiries"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              문의 목록
            </Link>
            <Link
              href="/admin/cases"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              사건 목록
            </Link>
            <Link
              href="/admin/site-content"
              className="inline-flex h-10 items-center rounded-full border border-primary bg-primary px-4 text-sm font-medium text-white transition hover:bg-[#143d5d]"
            >
              홈페이지 운영
            </Link>
            <Link
              href="/admin/case-studies"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              사례 관리
            </Link>
            <Link
              href="/admin/testimonials"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              후기 관리
            </Link>
            <Link
              href="/admin/credentials"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              경력 관리
            </Link>
            <Link
              href="/admin/fees"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              비용 관리
            </Link>
            <Link
              href="/admin/integrations"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              연동 센터
            </Link>
            <Link
              href="/admin/lawbot"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              AI 분석
            </Link>
            <Link
              href="/admin/intake-sources"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              유입 분석
            </Link>
            <Link
              href="/admin/stats"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              통계 / 재무
            </Link>
            <Link
              href="/admin/monitoring"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              모니터링
            </Link>
          </nav>
        </div>
      </section>

      <AdminOpsBanner />

      {children}
    </div>
  );
}
