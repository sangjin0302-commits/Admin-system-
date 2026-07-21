"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isPageVisible } from "@/lib/services/admin-page-tiers";
import { NAV_GROUPS, BADGE_MAP, type SidebarCounts, type NavItem } from "./admin-nav-config";

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function AdminTopNav({
  newInquiryCount = 0,
  hideMode = false,
  showAdvanced = false,
}: {
  newInquiryCount?: number;
  hideMode?: boolean;
  showAdvanced?: boolean;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SidebarCounts>({ unresponded: 0, receivables: 0, dueSoon: 0, quotePending: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/sidebar-counts", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as SidebarCounts;
        if (alive) setCounts(data);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const filteredGroups = useMemo(() => NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => !hideMode ? true : isPageVisible(item.href, hideMode, showAdvanced)),
  })).filter((g) => g.items.length > 0), [hideMode, showAdvanced]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const activeGroup = useMemo(() => {
    return filteredGroups.find((g) => g.items.some((i) => isActive(i.href))) ?? filteredGroups[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, filteredGroups]);

  const displayGroup = filteredGroups.find((g) => g.title === hoveredGroup) ?? activeGroup;

  const renderBadge = (item: NavItem) => {
    if (item.href === "/admin/inquiries" && newInquiryCount > 0) {
      return (
        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {newInquiryCount > 99 ? "99+" : newInquiryCount}
        </span>
      );
    }
    const key = BADGE_MAP[item.href];
    if (key && counts[key] > 0) {
      return (
        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {counts[key] > 99 ? "99+" : counts[key]}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Desktop 2-tier top nav */}
      <div className="sticky top-0 z-30 hidden lg:block bg-surface border-b border-line">
        {/* Tier 1: main tabs */}
        <div className="h-12 flex items-stretch px-4 border-b border-line bg-surface">
          <Link href="/admin" className="flex items-center pr-6 mr-2 border-r border-line">
            <span className="font-serif text-sm font-bold tracking-wider text-primary">ETHOS</span>
            <span className="ml-2 text-xs text-text-muted">관리자</span>
          </Link>
          <nav className="flex items-stretch gap-1">
            {filteredGroups.map((group) => {
              const isActiveGroup = activeGroup?.title === group.title;
              const firstHref = group.items[0]?.href ?? "/admin";
              return (
                <Link
                  key={group.title}
                  href={firstHref}
                  onMouseEnter={() => setHoveredGroup(group.title)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className={cn(
                    "relative flex items-center px-4 text-sm font-medium transition-colors",
                    isActiveGroup
                      ? "text-primary"
                      : "text-text-muted hover:text-text-strong"
                  )}
                >
                  {group.title}
                  {isActiveGroup && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary rounded-t" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Tier 2: sub-items */}
        {displayGroup && (
          <div className="h-10 flex items-center gap-1 overflow-x-auto px-4 bg-surface-muted">
            {displayGroup.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-muted hover:bg-surface hover:text-text-strong"
                  )}
                >
                  <NavIcon d={item.icon} />
                  <span>{item.label}</span>
                  {renderBadge(item)}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile: hamburger + drawer */}
      <div className="lg:hidden sticky top-0 z-30 bg-surface border-b border-line">
        <div className="h-12 flex items-center justify-between px-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold tracking-wider text-primary">ETHOS</span>
            <span className="text-xs text-text-muted">관리자</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
            aria-label="메뉴"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              {mobileOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-line shadow-floating overflow-y-auto transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-4">
          <span className="font-serif text-lg font-bold tracking-wider text-primary">ETHOS</span>
          <span className="text-xs text-text-muted">관리자</span>
        </div>
        <div className="p-2 space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              <div className="admin-nav-section mb-1 px-2">{group.title}</div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-muted hover:bg-surface-muted hover:text-text-strong"
                    )}
                  >
                    <NavIcon d={item.icon} />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto">{renderBadge(item)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
