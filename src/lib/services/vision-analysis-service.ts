export type VisionAnalysisType = "document" | "id" | "form" | "scene";

export type VisionAnalysisInput = {
  imageBase64: string;
  mimeType: string;
  analysisType: VisionAnalysisType;
};

export type DetectedField = {
  name: string;
  value: string;
  confidence: number;
};

export type VisionAnalysisResult = {
  description: string;
  extractedText?: string;
  detectedFields: DetectedField[];
  classifications: string[];
  suggestedActions: string[];
};

const PROMPTS: Record<VisionAnalysisType, string> = {
  document:
    "이 이미지는 행정/법률 문서로 추정됩니다. 문서 종류, 발급기관, 주요 정보(이름, 날짜, 번호)를 한국어로 요약하고, 추출 가능한 텍스트와 핵심 필드를 JSON으로 식별해 주세요.",
  id: "이 이미지는 신분증으로 추정됩니다. 신분증 종류, 이름, 생년월일, 발급일, 발급기관 등 필드를 식별하여 한국어로 요약하세요. 개인정보 보호에 유의하세요.",
  form: "이 이미지는 양식(폼)입니다. 양식 종류, 각 입력 필드 명칭과 값, 작성 완료 여부를 한국어로 분석하세요.",
  scene:
    "이 이미지의 장면을 한국어로 설명하세요. 등장 객체, 장소, 상황, 사고/현장 관련성을 분석하고 후속 조치 후보를 제안하세요.",
};

export async function analyzeImage(
  input: VisionAnalysisInput,
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await analyzeWithClaude(input, apiKey);
    } catch (err) {
      console.error("Vision analysis failed, falling back to mock:", err);
    }
  }
  return mockAnalysis(input);
}

function mockAnalysis(input: VisionAnalysisInput): VisionAnalysisResult {
  const base: Record<VisionAnalysisType, VisionAnalysisResult> = {
    document: {
      description:
        "[모의 분석] 행정 문서로 보입니다. 발급기관과 일자가 명시되어 있으며, 본문에 신청인 정보가 포함되어 있습니다.",
      extractedText:
        "발급기관: ○○구청\n발급일자: 2026-05-12\n신청인: 홍길동\n주민등록번호: 900101-1******\n주소: 서울특별시 중구 ...",
      detectedFields: [
        { name: "발급기관", value: "○○구청", confidence: 0.92 },
        { name: "발급일자", value: "2026-05-12", confidence: 0.95 },
        { name: "신청인", value: "홍길동", confidence: 0.88 },
      ],
      classifications: ["행정문서", "한국어", "공문서"],
      suggestedActions: [
        "이 문서로 새 문의 생성",
        "OCR 검토 대기열에 추가",
        "사건 매트릭스에 첨부",
      ],
    },
    id: {
      description:
        "[모의 분석] 주민등록증 또는 외국인등록증으로 보입니다. 이름, 생년월일, 발급기관이 확인됩니다.",
      extractedText:
        "이름: 김철수\n생년월일: 1985-03-21\n발급일: 2020-01-15\n발급기관: 서울특별시장",
      detectedFields: [
        { name: "이름", value: "김철수", confidence: 0.94 },
        { name: "생년월일", value: "1985-03-21", confidence: 0.9 },
        { name: "발급기관", value: "서울특별시장", confidence: 0.91 },
      ],
      classifications: ["신분증", "주민등록증"],
      suggestedActions: ["고객 프로필 자동 작성", "본인확인 기록 저장"],
    },
    form: {
      description: "[모의 분석] 신청 양식입니다. 일부 필드가 비어 있습니다.",
      extractedText: "성명: ___\n연락처: 010-****-1234\n주소: 미작성",
      detectedFields: [
        { name: "연락처", value: "010-****-1234", confidence: 0.85 },
        { name: "성명", value: "(미작성)", confidence: 0.4 },
      ],
      classifications: ["양식", "미완성"],
      suggestedActions: ["미작성 필드 알림 발송", "양식 재요청"],
    },
    scene: {
      description:
        "[모의 분석] 실내 사무실 장면입니다. 책상 위 서류와 노트북이 확인됩니다.",
      detectedFields: [],
      classifications: ["사무실", "실내"],
      suggestedActions: ["증거 자료로 보관", "사건 첨부 후 메모"],
    },
  };
  return base[input.analysisType];
}

async function analyzeWithClaude(
  input: VisionAnalysisInput,
  apiKey: string,
): Promise<VisionAnalysisResult> {
  const prompt = `${PROMPTS[input.analysisType]}\n\n응답은 반드시 다음 JSON 형식만 출력하세요 (마크다운 코드블록 금지):\n{"description":"...","extractedText":"...","detectedFields":[{"name":"","value":"","confidence":0.0}],"classifications":["..."],"suggestedActions":["..."]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mimeType,
                data: input.imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in vision response");
  return JSON.parse(match[0]) as VisionAnalysisResult;
}
