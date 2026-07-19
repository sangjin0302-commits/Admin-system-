"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isPageVisible } from "@/lib/services/admin-page-tiers";
import { NAV_GROUPS, BADGE_MAP, type SidebarCounts } from "./admin-nav-config";

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function AdminSidebar({
  newInquiryCount = 0,
  hideMode = false,
  showAdvanced = false,
}: {
  newInquiryCount?: number;
  hideMode?: boolean;
  showAdvanced?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<SidebarCounts>({ unresponded: 0, receivables: 0, dueSoon: 0, quotePending: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/sidebar-counts", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as SidebarCounts;
        if (alive) setCounts(data);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // localStorage 를 렌더 중에 읽으면 안 된다 — 서버는 빈 Set 으로, 클라이언트는
  // 저장된 Set 으로 첫 렌더를 그려 hydration 불일치가 나고, 접어둔 그룹이 펼쳐졌다
  // 다시 접히는 깜빡임이 생긴다. 첫 렌더는 서버와 동일하게 두고 마운트 후 반영한다.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin.sidebar.collapsedGroups");
      if (raw) setCollapsedGroups(new Set(JSON.parse(raw) as string[]));
    } catch {
      // 저장값이 깨졌으면 기본값(모두 펼침)을 쓴다.
    }
  }, []);
  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      try { localStorage.setItem("admin.sidebar.collapsedGroups", JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const sidebar = (
    <nav className={cn(
      "flex flex-col gap-1 overflow-y-auto",
      collapsed ? "items-center" : ""
    )}>
      {NAV_GROUPS.map((group) => {
        const groupCollapsed = collapsedGroups.has(group.title);
        const filteredItems = group.items.filter((item) =>
          !hideMode ? true : isPageVisible(item.href, hideMode, showAdvanced),
        );
        if (filteredItems.length === 0) return null;
        return (
        <div key={group.title} className="mb-2">
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="admin-nav-section mb-1 hover:text-text"
              aria-expanded={!groupCollapsed}
            >
              <svg viewBox="0 0 8 8" fill="currentColor" className={cn("h-2 w-2 shrink-0 transition-transform duration-200", groupCollapsed ? "" : "rotate-90")}>
                <path d="M2 1l4 3-4 3V1z" />
              </svg>
              {group.title}
              {hideMode && (
                <span className="text-[9px] font-normal opacity-60">
                  {filteredItems.length}/{group.items.length}
                </span>
              )}
            </button>
          )}
          {(!groupCollapsed || collapsed) && filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive(item.href)
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:bg-surface-muted hover:text-text-strong"
              )}
              title={collapsed ? item.label : undefined}
            >
              <NavIcon d={item.icon} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.href === "/admin/inquiries" && newInquiryCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {newInquiryCount > 99 ? "99+" : newInquiryCount}
                </span>
              )}
              {!collapsed && BADGE_MAP[item.href] && counts[BADGE_MAP[item.href]] > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {counts[BADGE_MAP[item.href]] > 99 ? "99+" : counts[BADGE_MAP[item.href]]}
                </span>
              )}
            </Link>
          ))}
        </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-floating lg:hidden"
        aria-label="메뉴"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
          {mobileOpen
            ? <path d="M6 18L18 6M6 6l12 12" />
            : <path d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-line shadow-floating transform transition-transform duration-300 lg:hidden overflow-y-auto",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-4">
          <span className="font-serif text-lg font-bold tracking-wider text-primary">ETHOS</span>
          <span className="text-xs text-text-muted">관리자</span>
        </div>
        <div className="p-2">
          {sidebar}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:shrink-0 rounded-xl border border-line bg-surface shadow-panel transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}>
        <div className="flex items-center justify-between border-b border-line px-3 py-3">
          {!collapsed && (
            <span className="font-serif text-sm font-bold tracking-wider text-primary">ETHOS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-strong"
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              {collapsed
                ? <path d="M9 5l7 7-7 7" />
                : <path d="M15 19l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sidebar}
        </div>
        {!collapsed && (
          <div className="border-t border-line px-3 py-2 text-[11px] text-text-muted">
            빠른 검색{" "}
            <kbd className="ml-1 rounded border border-line-strong bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
            <span className="mx-0.5">+</span>
            <kbd className="rounded border border-line-strong bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
          </div>
        )}
      </aside>
    </>
  );
}
