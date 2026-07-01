import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ETHOS 행정사사무소 — 비자 · 행정심판 · 인허가, 2주 안에 해결 방향을 드립니다";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a3c5f 0%, #16324e 55%, #122a44 100%)",
          padding: 80,
          position: "relative"
        }}
      >
        {/* 좌측 골드 그라디언트 액센트 바 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 14,
            background: "linear-gradient(180deg, #c9a961 0%, rgba(201,169,97,0.35) 50%, #c9a961 100%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 14,
            bottom: 0,
            width: 40,
            background: "linear-gradient(90deg, rgba(201,169,97,0.18), transparent)"
          }}
        />

        {/* 로고 심볼 — 기둥 + 별 + 손 */}
        <svg width="110" height="110" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#c9a961" strokeWidth="2.5" />
          <path d="M60 18 L62 28 L72 30 L62 32 L60 42 L58 32 L48 30 L58 28 Z" fill="#c9a961" />
          <rect x="46" y="50" width="28" height="34" fill="#faf6ef" />
          <rect x="42" y="84" width="36" height="3" fill="#faf6ef" />
          <path d="M 30 96 Q 40 86 60 90 Q 80 86 90 96 Q 78 102 60 102 Q 42 102 30 96 Z" fill="#c9a961" />
        </svg>

        {/* 메인 타이틀 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            marginTop: 36
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: 14,
              color: "#faf6ef",
              lineHeight: 1
            }}
          >
            ETHOS
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#faf6ef",
              lineHeight: 1
            }}
          >
            행정사사무소
          </div>
        </div>

        {/* 골드 디바이더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 32px" }}>
          <div style={{ width: 90, height: 1, background: "#c9a961" }} />
          <div style={{ width: 8, height: 8, background: "#c9a961", transform: "rotate(45deg)" }} />
          <div style={{ width: 90, height: 1, background: "#c9a961" }} />
        </div>

        {/* 서브라인 */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(250,246,239,0.9)",
            textAlign: "center",
            fontWeight: 600,
            lineHeight: 1.5,
            maxWidth: 920,
            display: "flex"
          }}
        >
          비자 · 행정심판 · 인허가 — 2주 안에 해결 방향을 드립니다
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#c9a961",
            fontStyle: "italic",
            marginTop: 18,
            letterSpacing: 1
          }}
        >
          Reason in Process · Empathy for People · Trust in Every Step
        </div>
      </div>
    ),
    { ...size }
  );
}
