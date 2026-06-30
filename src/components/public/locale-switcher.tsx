"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

const LOCALES = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLang = searchParams.get("lang") || "ko";

  function switchLang(lang: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-gold/30 bg-surface p-1">
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          onClick={() => switchLang(loc.code)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            currentLang === loc.code
              ? "bg-primary text-white"
              : "text-text-muted hover:bg-gold-soft/30"
          }`}
          title={loc.label}
        >
          {loc.flag} {loc.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
