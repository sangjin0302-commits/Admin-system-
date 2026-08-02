import "server-only";

import { prisma } from "@/lib/prisma/client";

/**
 * 특정 언어·네임스페이스의 admin override 를 DB(SiteSetting `i18n.overrides.{lang}`)에서
 * **요청마다** 읽어 반환한다.
 *
 * locales/index.ts 의 setI18nOverrides 는 모듈 전역 상태라 요청 간 누수 위험이 있어
 * (admin 편집기 전용), 공개 페이지에서는 이 무상태 로더를 쓴다.
 */
export async function loadNamespaceOverride(
  lang: "ko" | "en" | "zh",
  namespace: string
): Promise<Record<string, string>> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: `i18n.overrides.${lang}` }
    });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value) as Record<string, Record<string, string>>;
    const ns = parsed[namespace];
    return ns && typeof ns === "object" ? ns : {};
  } catch {
    return {};
  }
}
