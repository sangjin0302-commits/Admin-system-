export const uiLocaleValues = ["ko", "en"] as const;
export type UiLocale = (typeof uiLocaleValues)[number];

export function normalizeUiLocale(value: unknown, fallback: UiLocale = "ko"): UiLocale {
  return value === "en" ? "en" : fallback;
}

export type LocaleMessages<K extends string> = Record<UiLocale, Record<K, string>>;

export function createTranslator<K extends string>(
  messages: LocaleMessages<K>,
  locale: UiLocale
) {
  return (key: K) => messages[locale][key] ?? messages.ko[key];
}
