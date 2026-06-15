import { ImageResponse } from "next/og";

import { getBlogPostBySlug } from "@/lib/blog-posts";

export const alt = "ETHOS 법률 칼럼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug).catch(() => null);
  const title = post?.title ?? "법률 칼럼";
  const category = post?.category ?? "ETHOS";

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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#c9a961" }} />

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
              background: "#1a3c5f",
              padding: "8px 22px",
              borderRadius: 999,
              marginBottom: 28
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1a3c5f", lineHeight: 1.25, maxWidth: 1000 }}>
            {title.length > 46 ? title.slice(0, 46) + "…" : title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 70, height: 1, background: "#c9a961" }} />
          <div style={{ fontSize: 22, color: "#a88647", fontStyle: "italic" }}>법률 칼럼 · Legal Column</div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: "#c9a961" }} />
      </div>
    ),
    { ...size }
  );
}
