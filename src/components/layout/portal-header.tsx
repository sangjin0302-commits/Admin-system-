import Link from "next/link";

import { EthosLogo } from "@/components/brand/ethos-logo";
import { PortalBell } from "@/components/layout/portal-bell";

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
          <PortalBell />
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
