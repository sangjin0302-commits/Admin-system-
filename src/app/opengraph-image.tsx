import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ETHOS 행정사사무소 — 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를";
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
          background: "linear-gradient(135deg, #faf6ef 0%, #f5ede0 100%)",
          padding: 80,
          position: "relative"
        }}
      >
        {/* 좌상단 곡선 장식 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, transparent 0%, #c9a961 50%, transparent 100%)"
          }}
        />

        {/* 로고 영역 — SVG 비슷한 모양 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginBottom: 40
          }}
        >
          {/* 기둥 + 별 */}
          <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1a3c5f" strokeWidth="3" />
            <path d="M60 18 L62 28 L72 30 L62 32 L60 42 L58 32 L48 30 L58 28 Z" fill="#c9a961" />
            <rect x="46" y="50" width="28" height="34" fill="#1a3c5f" />
            <rect x="42" y="84" width="36" height="3" fill="#1a3c5f" />
            <path
              d="M 30 96 Q 40 86 60 90 Q 80 86 90 96 Q 78 102 60 102 Q 42 102 30 96 Z"
              fill="#c9a961"
            />
          </svg>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 92,
                fontWeight: 800,
                letterSpacing: 16,
                color: "#1a3c5f",
                lineHeight: 1
              }}
            >
              ETHOS
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 22,
                color: "#1a3c5f",
                letterSpacing: 2
              }}
            >
              Administrative Attorney Office
            </div>
          </div>
        </div>

        {/* 골드 라인 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "20px 0 30px"
          }}
        >
          <div style={{ width: 80, height: 1, background: "#c9a961" }} />
          <div style={{ width: 8, height: 8, background: "#c9a961", transform: "rotate(45deg)" }} />
          <div style={{ width: 80, height: 1, background: "#c9a961" }} />
        </div>

        {/* 메인 카피 */}
        <div
          style={{
            fontSize: 32,
            color: "#1a3c5f",
            textAlign: "center",
            fontWeight: 600,
            lineHeight: 1.4,
            maxWidth: 900
          }}
        >
          비자 · 행정심판 · 계약서 · 인허가
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a88647",
            fontStyle: "italic",
            marginTop: 16
          }}
        >
          Reason in Process · Empathy for People · Trust in Every Step
        </div>

        {/* 하단 곡선 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, transparent 0%, #c9a961 50%, transparent 100%)"
          }}
        />
      </div>
    ),
    { ...size }
  );
}
