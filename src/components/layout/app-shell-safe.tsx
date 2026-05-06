"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const KO_APP_TITLE = "\uD589\uC815\uC0AC \uBB38\uC758 \uC811\uC218 \uBC0F \uC5C5\uBB34 \uAD00\uB9AC \uC2DC\uC2A4\uD15C";
const KO_PUBLIC_INTAKE = "\uACF5\uAC1C \uC811\uC218";
const KO_ADMIN = "\uAD00\uB9AC\uC790";

export function isHeaderlessPublicRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/intake" ||
    pathname.startsWith("/intake/") ||
    pathname === "/track" ||
    pathname.startsWith("/track/")
  );
}

export function AppShellSafe({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const hideGlobalHeader = isHeaderlessPublicRoute(pathname);

  return (
    <div className="ui-shell">
      <a href="#main-content" className="ui-skip-link">
        본문으로 바로 이동
      </a>
      {hideGlobalHeader ? null : (
        <header className="mb-6 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ui-kicker">Administrative Office Intake System</p>
              <h1 className="mt-1 text-xl font-semibold text-text-strong">{KO_APP_TITLE}</h1>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              <Link
                href="/intake"
                className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-text-strong transition hover:bg-surface-muted"
              >
                {KO_PUBLIC_INTAKE}
              </Link>
              <Link
                href="/admin"
                className="inline-flex h-10 items-center rounded-md border border-primary bg-primary px-4 text-white transition hover:bg-[#143d5d]"
              >
                {KO_ADMIN}
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
