"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FloatingContact } from "@/components/layout/floating-contact";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ScrollEnhancements } from "@/components/layout/scroll-enhancements";
import { StickyCta } from "@/components/layout/sticky-cta";

/**
 * Routes that use the system shell (admin/portal — internal tools).
 * Everything else gets the public marketing shell (PublicHeader + PublicFooter).
 */
function isSystemRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/portal");
}

export function AppShellSafe({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isSystem = isSystemRoute(pathname);

  if (isSystem) {
    // Admin / portal — minimal system shell
    return (
      <div className="ui-shell">
        <a href="#main-content" className="ui-skip-link">
          본문으로 바로 이동
        </a>
        <header className="mb-6 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ui-kicker">ETHOS Internal</p>
              <h1 className="mt-1 text-xl font-semibold text-text-strong">
                {pathname.startsWith("/admin") ? "관리자 시스템" : "의뢰인 포털"}
              </h1>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-text-strong transition hover:bg-surface-muted"
              >
                홈페이지로
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  // Public marketing site — full header + footer + floating contact
  return (
    <>
      <a href="#main-content" className="ui-skip-link">
        본문으로 바로 이동
      </a>
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
      <FloatingContact />
      <MobileBottomNav />
      <ScrollEnhancements />
      <StickyCta />
    </>
  );
}

export function isHeaderlessPublicRoute(pathname: string): boolean {
  return isSystemRoute(pathname);
}
