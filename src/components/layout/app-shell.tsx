"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { PageTransition } from "@/components/public/page-transition";
import { ScrollProgress } from "@/components/public/scroll-progress";
import { ExitIntent } from "@/components/public/exit-intent";
import { PWAInstallPrompt } from "@/components/public/pwa-install-prompt";
import { ChannelTracker } from "@/components/public/channel-tracker";
import { ScrollDepthTracker } from "@/components/public/scroll-depth-tracker";
import { ReturningVisitorBadge } from "@/components/public/returning-visitor-badge";

const PUBLIC_PATHS = ["/", "/about", "/services", "/cases", "/blog", "/track", "/intake", "/quick-check", "/contact", "/fees", "/privacy", "/terms", "/consult", "/en", "/keyword"];

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")));
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isPortal = pathname.startsWith("/portal");
  const isLinks = pathname.startsWith("/links");
  const isPublic = !isAdmin && !isPortal && !isLinks && isPublicRoute(pathname);

  if (isPortal || isLinks) {
    return <>{children}</>;
  }

  if (isPublic) {
    return (
      <div className="min-h-screen bg-canvas">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        <ScrollProgress />
        <PublicHeader />
        <main id="main-content"><PageTransition>{children}</PageTransition></main>
        <PublicFooter />
        <FloatingContact />
        <ExitIntent />
        <PWAInstallPrompt />
        <ChannelTracker />
        <ScrollDepthTracker />
        <ReturningVisitorBadge />
      </div>
    );
  }

  // 관리자 / 기타
  return (
    <div className="ui-shell">
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
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-text-strong transition hover:bg-surface-muted"
            >
              홈
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
      <main>{children}</main>
    </div>
  );
}
