"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 12l9-8 9 8M5 10v10h14V10" />
      </svg>
    )
  },
  {
    href: "/services",
    label: "업무",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    )
  },
  {
    href: "/quick-check",
    label: "AI 진단",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  },
  {
    href: "/track",
    label: "조회",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    )
  },
  {
    href: "/intake",
    label: "상담",
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
      </svg>
    )
  }
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* 본문이 nav에 가리지 않게 spacer */}
      <div aria-hidden className="h-16 lg:hidden" />

      <nav
        aria-label="모바일 하단 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const isPrimary = (item as { primary?: boolean }).primary;

            if (isPrimary) {
              return (
                <li key={item.href} className="relative flex items-start justify-center">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className="-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-primary text-white shadow-floating transition hover:bg-text-strong"
                  >
                    {item.icon}
                    <span className="mt-0.5 text-[10px] font-bold tracking-tight">{item.label}</span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 transition ${
                    active ? "text-primary" : "text-text-muted hover:text-primary"
                  }`}
                >
                  {item.icon}
                  <span className="font-serif text-[10px] font-bold tracking-tight">{item.label}</span>
                  {active ? (
                    <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-gold" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
