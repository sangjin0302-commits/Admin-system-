/**
 * i18n aggregator — collect all namespace locale bundles and expose a
 * simple lookup with fallback: zh → en → ko.
 *
 * Overrides can be layered on top via `mergeOverrides` from the admin
 * translation editor (stored in SiteSetting `i18n.overrides.{lang}`).
 */

import { PUBLIC_NAV_MESSAGES } from "./public-nav";

export type Lang = "ko" | "en" | "zh";
export const LANGS: readonly Lang[] = ["ko", "en", "zh"];

export function isLang(v: unknown): v is Lang {
  return v === "ko" || v === "en" || v === "zh";
}

export function normalizeLang(v: unknown, fallback: Lang = "ko"): Lang {
  return isLang(v) ? v : fallback;
}

type NamespaceBundle = Record<Lang, Record<string, string>>;

/** All available namespaces. Extend as more surfaces are localized. */
export const NAMESPACES: Record<string, NamespaceBundle> = {
  "public-nav": PUBLIC_NAV_MESSAGES as NamespaceBundle,
};

export type NamespaceKey = keyof typeof NAMESPACES;

/** In-memory overrides layer (populated by API from SiteSetting). */
let _overrides: Partial<Record<Lang, Record<string, Record<string, string>>>> = {};

/** Replace override layer entirely. Called from admin API PUT. */
export function setI18nOverrides(
  overrides: Partial<Record<Lang, Record<string, Record<string, string>>>>
): void {
  _overrides = overrides ?? {};
}

export function getI18nOverrides(): Partial<
  Record<Lang, Record<string, Record<string, string>>>
> {
  return _overrides;
}

/**
 * Build a translator function for a given lang + namespace.
 * Lookup order: override → primary → en → ko.
 */
export function getT(lang: Lang, namespace: string): (key: string) => string {
  const bundle = NAMESPACES[namespace];
  const override = _overrides[lang]?.[namespace];
  return (key: string) => {
    if (override && key in override) return override[key];
    if (bundle) {
      const primary = bundle[lang]?.[key];
      if (primary != null && primary !== "") return primary;
      const en = bundle.en?.[key];
      if (en != null && en !== "") return en;
      const ko = bundle.ko?.[key];
      if (ko != null && ko !== "") return ko;
    }
    return key;
  };
}

/**
 * Return the flat list of keys + all-lang values for a namespace,
 * suitable for the admin editor grid.
 */
export function listNamespaceEntries(namespace: string): Array<{
  key: string;
  values: Record<Lang, string>;
  overrides: Partial<Record<Lang, string>>;
}> {
  const bundle = NAMESPACES[namespace];
  if (!bundle) return [];
  const keys = new Set<string>();
  for (const l of LANGS) {
    for (const k of Object.keys(bundle[l] ?? {})) keys.add(k);
  }
  return Array.from(keys)
    .sort()
    .map((key) => ({
      key,
      values: {
        ko: bundle.ko?.[key] ?? "",
        en: bundle.en?.[key] ?? "",
        zh: bundle.zh?.[key] ?? "",
      },
      overrides: {
        ko: _overrides.ko?.[namespace]?.[key],
        en: _overrides.en?.[namespace]?.[key],
        zh: _overrides.zh?.[namespace]?.[key],
      },
    }));
}
