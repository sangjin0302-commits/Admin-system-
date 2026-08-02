import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma/client";

/**
 * 특정 언어·네임스페이스의 admin override 를 DB(SiteSetting `i18n.overrides.{lang}`)에서
 * 읽어 반환한다. 60초 캐시(요청마다 DB 조회 방지) — 편집 후 최대 60초 뒤 반영.
 *
 * locales/index.ts 의 setI18nOverrides 는 모듈 전역 상태라 요청 간 누수 위험이 있어
 * (admin 편집기 전용), 공개 페이지에서는 이 무상태 로더를 쓴다.
 */
async function readOverrideRow(lang: "ko" | "en" | "zh"): Promise<Record<string, Record<string, string>>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: `i18n.overrides.${lang}` } });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value) as Record<string, Record<string, string>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const readOverrideRowCached = unstable_cache(readOverrideRow, ["i18n-overrides"], {
  revalidate: 60,
  tags: ["i18n-overrides"]
});

export async function loadNamespaceOverride(
  lang: "ko" | "en" | "zh",
  namespace: string
): Promise<Record<string, string>> {
  const parsed = await readOverrideRowCached(lang);
  const ns = parsed[namespace];
  return ns && typeof ns === "object" ? ns : {};
}
