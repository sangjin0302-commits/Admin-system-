import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "질문이 필요합니다." }, { status: 400 });
    }

    const apiUrl = process.env.MARKET_BOT_API_URL;
    const apiKey = process.env.MARKET_BOT_API_KEY;

    if (apiUrl && apiKey) {
      try {
        const r = await fetch(`${apiUrl}/api/v1/web/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
          body: JSON.stringify({ query, tier: "admin", max_length: 5000 }),
        });
        const data = await r.json();
        return NextResponse.json({ answer: data.answer ?? "응답 없음" });
      } catch (err) {
        logger.error("Market bot API error:", err);
      }
    }

    const mock = `[관리자 모드 · 마켓 분석 봇]

질문: "${query}"

📊 시장 개요:
해당 업종의 시장 규모는 최근 3년간 연평균 12% 성장세를 보이고 있으며, 주요 수요 동인은 외국인 인구 증가와 규제 강화 추세입니다.

🎯 경쟁 환경:
상위 5개사가 시장의 약 30%를 차지하고 있으며, 나머지는 소규모 사무소들이 분산 운영. 차별화 포인트는 디지털화·다국어 서비스·전문 분야 특화입니다.

📈 전략 권장:
1. 디지털 전환 가속 (현 시스템 강점 활용)
2. 외국인 고객 특화 마케팅
3. 법인·기업 수주 확대

* 실제 봇 연동 시 MARKET_BOT_API_URL + MARKET_BOT_API_KEY 환경변수 설정 필요`;

    return NextResponse.json({ answer: mock });
  } catch (err) {
    logger.error("Market bot query error:", err);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
