"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isPageVisible } from "@/lib/services/admin-page-tiers";
import { NAV_GROUPS, BADGE_MAP, type SidebarCounts, type NavItem } from "./admin-nav-config";

const FAVORITES_KEY = "admin:favorites";

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 12.81c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
  const [favorites, setFavorites] = useState<NavItem[]>([]);

  // 즐겨찾기: localStorage 기반(서버 무관, DB 불필요). 마운트 시 1회 로드.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((it) => it && typeof it.href === "string" && typeof it.label === "string"));
        }
      }
    } catch { /* ignore malformed */ }
  }, []);

  const isFav = (href: string) => favorites.some((f) => f.href === href);

  const toggleFav = (item: NavItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.href === item.href);
      const next = exists
        ? prev.filter((f) => f.href !== item.href)
        : [...prev, { href: item.href, label: item.label, icon: item.icon }];
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
      return next;
    });
  };

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
        {/* Tier 0: 즐겨찾기 (핀 고정된 페이지가 있을 때만) */}
        {favorites.length > 0 && (
          <div className="h-9 flex items-center gap-1 overflow-x-auto px-4 border-b border-line bg-surface">
            <span className="mr-1 shrink-0 text-[11px] font-semibold text-text-muted/70">즐겨찾기</span>
            {favorites.map((f) => {
              const active = isActive(f.href);
              return (
                <div key={f.href} className="group inline-flex items-center shrink-0">
                  <Link
                    href={f.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                      active ? "bg-primary text-white shadow-sm" : "text-text-muted hover:bg-surface-muted hover:text-text-strong"
                    )}
                  >
                    <NavIcon d={f.icon} />
                    <span>{f.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFav(f)}
                    aria-label={`${f.label} 즐겨찾기 해제`}
                    title="즐겨찾기 해제"
                    className="ml-0.5 rounded p-0.5 text-amber-500 hover:text-amber-600"
                  >
                    <StarIcon filled />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
              const fav = isFav(item.href);
              return (
                <div key={item.href} className="group inline-flex items-center shrink-0">
                  <Link
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
                  <button
                    type="button"
                    onClick={() => toggleFav(item)}
                    aria-label={fav ? `${item.label} 즐겨찾기 해제` : `${item.label} 즐겨찾기 추가`}
                    title={fav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                    className={cn(
                      "ml-0.5 rounded p-0.5 transition-opacity",
                      fav
                        ? "text-amber-500"
                        : "text-text-muted/40 opacity-0 group-hover:opacity-100 hover:text-amber-500"
                    )}
                  >
                    <StarIcon filled={fav} />
                  </button>
                </div>
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
