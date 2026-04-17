"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const hideGlobalHeader = pathname.startsWith("/intake");

  return (
    <div className="ui-shell">
      {hideGlobalHeader ? null : (
        <header className="mb-6 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ui-kicker">Administrative Office Intake System</p>
              <h1 className="mt-1 text-xl font-semibold text-text-strong">
                행정사 문의 접수 및 업무 관리 시스템
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
                href="/admin"
                className="inline-flex h-10 items-center rounded-md border border-primary bg-primary px-4 text-white transition hover:bg-[#143d5d]"
              >
                관리자
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}
