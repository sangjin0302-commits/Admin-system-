import { ImageResponse } from "next/og";

import { getBlogPostBySlug } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";

export const alt = "ETHOS 법률 칼럼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 카테고리별 강조 색 (네이비 그라데이션 + 골드 변주)
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

const CATEGORY_KR_LABEL: Record<string, string> = {
  visa: "비자·체류",
  naturalization: "귀화·국적",
  refugee: "난민",
  appeal: "행정심판",
  contract: "계약·사실조사",
  license: "인허가",
  corporate: "법인설립",
  other: "법률 칼럼"
};

export default async function BlogOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const md = await getBlogPostBySlug(slug).catch(() => null);
  let title = md?.title ?? "법률 칼럼";
  let category = md?.category ?? "ETHOS";
  if (!md) {
    const db = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
    if (db) {
      title = db.title;
      category = db.category || category;
    }
  }
  const theme = CATEGORY_THEME[category] ?? CATEGORY_THEME.other;
  const chipLabel = CATEGORY_KR_LABEL[category] ?? category;

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
          <div style={{ fontSize: 20, color: "#a88647" }}>행정사사무소</div>
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
          <div style={{ fontSize: 22, color: "#a88647", fontStyle: "italic" }}>법률 칼럼 · Legal Column</div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: theme.tint }} />
      </div>
    ),
    { ...size }
  );
}
