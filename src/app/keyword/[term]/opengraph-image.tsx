import { ImageResponse } from "next/og";

export const alt = "ETHOS 키워드 가이드";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KEYWORD_THEME: Record<string, { tint: string; label: string; chipBg: string }> = {
  "d-8-비자": { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", label: "D-8 비자 (기업투자)", chipBg: "#1a3c5f" },
  "d-10-비자": { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", label: "D-10 비자 (구직)", chipBg: "#1a3c5f" },
  "f-2-7-비자": { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", label: "F-2-7 비자 (점수제 거주)", chipBg: "#1a3c5f" },
  "행정심판": { tint: "linear-gradient(135deg, #a88647 0%, #c9a961 100%)", label: "행정심판", chipBg: "#a88647" },
  "귀화": { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", label: "귀화 · 국적", chipBg: "#1a3c5f" },
  "법인설립": { tint: "linear-gradient(135deg, #774444 0%, #965a5a 100%)", label: "법인 설립", chipBg: "#774444" },
  "강제퇴거": { tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)", label: "강제퇴거 대응", chipBg: "#1a3c5f" }
};

export default async function KeywordOgImage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  const theme = KEYWORD_THEME[decoded] ?? {
    tint: "linear-gradient(135deg, #1a3c5f 0%, #2a4d77 100%)",
    label: decoded,
    chipBg: "#1a3c5f"
  };

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
              fontSize: 22,
              color: "#fff",
              background: theme.chipBg,
              padding: "8px 22px",
              borderRadius: 999,
              marginBottom: 24
            }}
          >
            키워드 가이드
          </div>
          <div style={{ fontSize: 78, fontWeight: 800, color: "#1a3c5f", lineHeight: 1.15 }}>
            {theme.label}
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#a88647", fontStyle: "italic" }}>
            행정사 Jean — 실무 가이드 + 관련 칼럼
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 70, height: 1, background: "#c9a961" }} />
          <div style={{ fontSize: 20, color: "#5c5444" }}>무료 검토 · 상담 유료 · 수임 시 차감</div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: theme.tint }} />
      </div>
    ),
    { ...size }
  );
}
