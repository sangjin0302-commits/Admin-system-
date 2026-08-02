import { redirect } from "next/navigation";

import { toPublicCategoryLoose, PUBLIC_CATEGORY_LABEL } from "@/lib/services/blog-categorizer";

export const dynamic = "force-dynamic";

/**
 * 구(舊) 카테고리 라우트 통합.
 *
 * 예전 `/blog/category/[name]` 은 exact-match 라 대부분 404 였고, 실제 사이트는
 * `/blog?cat=` 필터를 쓴다(중복·불일치 경로). 그래서 이 경로는 작동하는 필터로
 * 영구 리다이렉트해 하나로 합친다(기존 유입 링크·SEO 보존).
 */
export default async function BlogCategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { name } = await params;
  const lang = (await searchParams)?.lang === "en" ? "en" : "ko";
  const key = toPublicCategoryLoose(decodeURIComponent(name));
  const langQs = lang === "en" ? "&lang=en" : "";
  // 공개 5분류로 매핑되면 해당 필터로, 아니면 전체 목록으로.
  const target =
    key in PUBLIC_CATEGORY_LABEL && key !== "other"
      ? `/blog?cat=${key}${langQs}`
      : `/blog${lang === "en" ? "?lang=en" : ""}`;
  redirect(target);
}
