import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "에토스 행정사사무소(ETHOS) — 처리 사례";
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
          background: "linear-gradient(135deg, #faf6ef 0%, #f0e0c3 100%)",
          padding: 80,
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a961, transparent)" }} />

        <div style={{ fontSize: 18, color: "#a88647", fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, marginBottom: 20 }}>
          Case Studies
        </div>

        <div style={{ fontSize: 52, color: "#1a3c5f", fontWeight: 700, lineHeight: 1.2, marginBottom: 30 }}>
          처리 사례
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <div style={{ width: 60, height: 1, background: "#c9a961" }} />
          <div style={{ width: 6, height: 6, background: "#c9a961", transform: "rotate(45deg)" }} />
          <div style={{ width: 60, height: 1, background: "#c9a961" }} />
        </div>

        <div style={{ fontSize: 22, color: "#2c3e52", lineHeight: 1.6, maxWidth: 800 }}>
          비자·행정심판·계약서·인허가 — 분야별 실제 처리 사례를 확인하세요.
        </div>

        <div style={{ position: "absolute", bottom: 40, right: 80, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, color: "#1a3c5f" }}>ETHOS</span>
          <span style={{ fontSize: 14, color: "#5c5444" }}>행정사사무소</span>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a961, transparent)" }} />
      </div>
    ),
    { ...size }
  );
}
