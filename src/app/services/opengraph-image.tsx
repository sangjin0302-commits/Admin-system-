import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "에토스 행정사사무소(ETHOS) — 업무 분야";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a3c5f 0%, #16324e 55%, #122a44 100%)",
          padding: 80,
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a961, transparent)" }} />

        <div style={{ fontSize: 18, color: "#c9a961", fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, marginBottom: 20 }}>
          Practice Areas
        </div>

        <div style={{ fontSize: 52, color: "#faf6ef", fontWeight: 700, lineHeight: 1.2, marginBottom: 30 }}>
          비자 · 행정심판 · 계약서 · 인허가 · 법인설립
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <div style={{ width: 60, height: 1, background: "#c9a961" }} />
          <div style={{ width: 6, height: 6, background: "#c9a961", transform: "rotate(45deg)" }} />
          <div style={{ width: 60, height: 1, background: "#c9a961" }} />
        </div>

        <div style={{ fontSize: 22, color: "rgba(250,246,239,0.7)", lineHeight: 1.6, maxWidth: 800 }}>
          각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.
        </div>

        <div style={{ position: "absolute", bottom: 40, right: 80, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, color: "#faf6ef" }}>ETHOS</span>
          <span style={{ fontSize: 14, color: "rgba(250,246,239,0.5)" }}>행정사사무소</span>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a961, transparent)" }} />
      </div>
    ),
    { ...size }
  );
}
