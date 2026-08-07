import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n-request";
import { localePath } from "@/lib/i18n-locale";

export const dynamic = "force-dynamic";

/**
 * 게시판(폴더) 전용 URL — /blog/board/<이름>.
 * 공유·SEO 친화적 경로를 제공하되, 목록 렌더는 /blog 의 board 필터를 재사용하도록
 * 리다이렉트한다(중복 렌더 로직 방지). 로케일 유지(/en/blog/board/... → EN).
 */
export default async function BlogBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { name } = await params;
  const lang = await getRequestLocale((await searchParams)?.lang);
  const decoded = decodeURIComponent(name);
  redirect(`${localePath("/blog", lang)}?board=${encodeURIComponent(decoded)}`);
}
