import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "행정사 상담 접수 및 운영 시스템",
  description: "공개 상담 접수와 내부 운영 관리를 분리한 행정사 업무 시스템"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="ui-shell">
          <header className="mb-6 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="ui-kicker">Administrative Office Intake System</p>
                <h1 className="mt-1 text-xl font-semibold text-text-strong">
                  공개 접수와 내부 운영을 분리한 관리자 시스템
                </h1>
              </div>
              <nav className="flex flex-wrap gap-2 text-sm font-medium">
                <Link
                  href="/intake"
                  className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-text-strong transition hover:bg-surface-muted"
                >
                  공개 접수
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex h-10 items-center rounded-md border border-primary bg-primary px-4 text-white transition hover:bg-[#143d5d]"
                >
                  관리자 로그인
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
