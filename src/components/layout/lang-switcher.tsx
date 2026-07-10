"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { LANGS, isLang, type Lang } from "@/lib/i18n/locales";

const LABELS: Record<Lang, string> = {
  ko: "KO",
  en: "EN",
  zh: "中",
};

// Public switcher only supports ko/en. zh has no real public translations
// (see src/lib/i18n-public.ts normalizeLang) so it is hidden here even
// though the shared LANGS list still includes it for the admin locale system.
const PUBLIC_LANGS = LANGS.filter((l) => l !== "zh");

const COOKIE_NAME = "lang";

function readCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  if (!match) return null;
  const v = decodeURIComponent(match[1]);
  return isLang(v) ? v : null;
}

/** 3-button lang toggle. Writes to `?lang=` and a `lang` cookie. */
export function LangSwitcher() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const current: Lang = useMemo(() => {
    const q = sp.get("lang");
    if (isLang(q)) return q;
    // path-based fallback (existing /en, /ar routes still resolve to en)
    if (pathname?.startsWith("/en")) return "en";
    const c = readCookieLang();
    if (c) return c;
    return "ko";
  }, [sp, pathname]);

  const setLang = useCallback(
    (next: Lang) => {
      // Persist cookie for cross-navigation stickiness
      if (typeof document !== "undefined") {
        document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
      const params = new URLSearchParams(sp?.toString() ?? "");
      if (next === "ko") params.delete("lang");
      else params.set("lang", next);
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [pathname, router, sp]
  );

  return (
    <div
      className="hidden items-center gap-1 border-r border-gold/30 pr-3 lg:flex"
      role="group"
      aria-label="Language"
    >
      {PUBLIC_LANGS.map((lang, i) => (
        <span key={lang} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLang(lang)}
            aria-pressed={current === lang}
            className={`px-2 font-serif text-xs font-bold ${
              current === lang ? "text-primary" : "text-text-muted hover:text-primary"
            }`}
          >
            {LABELS[lang]}
          </button>
          {i < PUBLIC_LANGS.length - 1 && <span className="text-gold/40">|</span>}
        </span>
      ))}
    </div>
  );
}
