import { ImageResponse } from "next/og";

import { getBlogPostBySlug } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { publicCategoryLabel, toPublicCategoryLoose } from "@/lib/services/blog-categorizer";

/**
 * 블로그 OG 공유 이미지 — 언어별(`?lang=en`) 생성.
 *
 * 파일 컨벤션 opengraph-image 는 searchParams 를 못 받아 국·영 공유카드가 모두
 * 한글로 나왔다. 라우트 핸들러는 쿼리를 읽을 수 있어, blog 상세 metadata 가
 * `/blog/[slug]/og?lang=en` 을 og:image 로 지정하면 EN 카드가 영문 제목으로 나온다.
 */

export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

const CATEGORY_THEME: Record<string, { tint: string; chipBg: string }> = {
  visa: { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", chipBg: "#1a3c5f" },
  naturalization: { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", chipBg: "#1a3c5f" },
  refugee: { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", chipBg: "#1a3c5f" },
  appeal: { tint: "linear-gradient(135deg, #a88647 0%, #c9a961 100%)", chipBg: "#a88647" },
  contract: { tint: "linear-gradient(135deg, #2b5f4a 0%, #3e7e62 100%)", chipBg: "#2b5f4a" },
  license: { tint: "linear-gradient(135deg, #5c4477 0%, #7a5a96 100%)", chipBg: "#5c4477" },
  corporate: { tint: "linear-gradient(135deg, #774444 0%, #965a5a 100%)", chipBg: "#774444" },
  other: { tint: "linear-gradient(135deg, #4a4a4a 0%, #6b6b6b 100%)", chipBg: "#4a4a4a" }
};


export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const en = new URL(req.url).searchParams.get("lang") === "en";

  const md = await getBlogPostBySlug(slug).catch(() => null);
  let title = md?.title ?? (en ? "Legal Column" : "법률 칼럼");
  let category = md?.category ?? "other";
  if (!md) {
    const db = await prisma.blogPost
      .findUnique({ where: { slug }, select: { title: true, titleEn: true, category: true } })
      .catch(() => null);
    if (db) {
      title = en ? db.titleEn || db.title : db.title;
      category = db.category || category;
    }
  }
  // 내부 카테고리·마크다운 한글라벨도 공개 5분류로 정규화(상세 페이지와 동일 라벨).
  const pubCat = toPublicCategoryLoose(category);
  const theme = CATEGORY_THEME[pubCat] ?? CATEGORY_THEME.other;
  const chipLabel = publicCategoryLabel(pubCat, en ? "en" : "ko");
  const brand = en ? "Administrative Attorney" : "행정사사무소";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #faf6ef 0%, #f5ede0 100%)",
          padding: 72,
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: theme.tint }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8, color: "#1a3c5f" }}>ETHOS</div>
          <div style={{ fontSize: 20, color: "#a88647" }}>{brand}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: 24,
              color: "#fff",
              background: theme.chipBg,
              padding: "8px 22px",
              borderRadius: 999,
              marginBottom: 28
            }}
          >
            {chipLabel}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1a3c5f", lineHeight: 1.25, maxWidth: 1000 }}>
            {title.length > 46 ? title.slice(0, 46) + "…" : title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 70, height: 1, background: theme.tint }} />
          <div style={{ fontSize: 22, color: "#a88647", fontStyle: "italic" }}>
            {en ? "Legal Column" : "법률 칼럼 · Legal Column"}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: theme.tint }} />
      </div>
    ),
    {
      ...SIZE,
      // Satori 렌더는 CPU 비용이 크므로 소셜 재스크레이프용으로 장기 캐시.
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" }
    }
  );
}
