import { ImageResponse } from "next/og";

import { getPublicCaseBySlug } from "@/lib/public-cases";

export const dynamic = "force-dynamic";
export const alt = "ETHOS 처리 사례";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG 이미지는 prisma 의존 없이 기본 사례만 맞춤 렌더(안정성). DB 사례는 일반 카드.
export default async function CaseOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getPublicCaseBySlug(slug);
  const title = c?.title ?? "처리 사례";
  const category = c?.categoryLabel ?? "ETHOS";
  const outcome = c?.outcome ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1a3c5f 0%, #16345a 100%)",
          padding: 72,
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#c9a961" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8, color: "#fff" }}>ETHOS</div>
          <div style={{ fontSize: 20, color: "#e8d4a0" }}>처리 사례</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: 24,
              color: "#1a3c5f",
              background: "#c9a961",
              padding: "8px 22px",
              borderRadius: 999,
              marginBottom: 28,
              fontWeight: 700
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, color: "#fff", lineHeight: 1.25, maxWidth: 1000 }}>
            {title.length > 44 ? title.slice(0, 44) + "…" : title}
          </div>
          {outcome ? (
            <div style={{ marginTop: 20, fontSize: 26, color: "#e8d4a0" }}>
              결과: {outcome.length > 50 ? outcome.slice(0, 50) + "…" : outcome}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
          ※ 익명화된 사례이며 개별 결과를 보장하지 않습니다.
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: "#c9a961" }} />
      </div>
    ),
    { ...size }
  );
}
