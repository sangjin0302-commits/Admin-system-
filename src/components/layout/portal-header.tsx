import Link from "next/link";

import { EthosLogo } from "@/components/brand/ethos-logo";

export function PortalHeader({ clientName }: { clientName?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gold/30 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/portal" className="flex items-center gap-3">
          <EthosLogo size={36} />
          <div>
            <p className="font-serif text-base font-bold tracking-[0.18em] text-primary">ETHOS</p>
            <p className="-mt-0.5 font-serif text-[10px] tracking-wide text-text-muted">Client Portal</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/portal/notifications"
            aria-label="알림"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-gold-soft/30 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
              <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3z" />
              <path d="M9 19a3 3 0 0 0 6 0" />
            </svg>
          </Link>
          <Link
            href="/"
            className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition hover:text-primary sm:inline-flex"
          >
            홈페이지
          </Link>
          {clientName && (
            <span className="hidden items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/20 px-3 py-1.5 text-xs font-semibold text-gold-deep sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {clientName}님
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
