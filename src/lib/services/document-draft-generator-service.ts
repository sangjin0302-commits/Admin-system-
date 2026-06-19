export type DraftType =
  | "appeal"
  | "complaint"
  | "petition"
  | "application"
  | "objection";

export type DraftInput = {
  type: DraftType;
  clientName: string;
  agency: string;
  subject: string;
  facts: string;
  legalBasis?: string;
};

const TYPE_TITLES: Record<DraftType, string> = {
  appeal: "행정심판 청구서",
  complaint: "진정서",
  petition: "민원",
  application: "인허가 신청서",
  objection: "이의신청서",
};

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function templateAppeal(input: DraftInput): string {
  return `행정심판 청구서

청구인: ${input.clientName}
피청구인: ${input.agency}
처분명: ${input.subject}

청구취지
피청구인이 청구인에 대하여 한 ${input.subject} 처분을 취소한다.

청구원인
${input.facts}

관계 법령
${input.legalBasis ?? "행정심판법 제3조, 관련 개별 법령 등"}

위와 같은 사유로 본 행정심판을 청구합니다.

${formatDate()}
청구인 ${input.clientName} (인)`;
}

function templateComplaint(input: DraftInput): string {
  return `진정서

진정인: ${input.clientName}
수신: ${input.agency}
제목: ${input.subject}

진정 취지
${input.subject}와 관련하여 아래와 같이 진정합니다.

진정 내용
${input.facts}

근거
${input.legalBasis ?? "관련 법령 및 행정 규칙"}

위 사항을 검토하시어 적절한 조치를 취해 주시기 바랍니다.

${formatDate()}
진정인 ${input.clientName} (인)`;
}

function templatePetition(input: DraftInput): string {
  return `민원 신청서

신청인: ${input.clientName}
수신: ${input.agency}
제목: ${input.subject}

민원 내용
${input.facts}

관련 근거
${input.legalBasis ?? "민원 처리에 관한 법률 등"}

위 민원에 대한 신속한 처리를 부탁드립니다.

${formatDate()}
신청인 ${input.clientName} (인)`;
}

function templateApplication(input: DraftInput): string {
  return `인허가 신청서

신청인: ${input.clientName}
수신: ${input.agency}
신청명: ${input.subject}

신청 사유
${input.facts}

근거 법령
${input.legalBasis ?? "관련 인허가 법령"}

위와 같이 ${input.subject}을(를) 신청하오니 허가하여 주시기 바랍니다.

${formatDate()}
신청인 ${input.clientName} (인)`;
}

function templateObjection(input: DraftInput): string {
  return `이의신청서

신청인: ${input.clientName}
수신: ${input.agency}
처분명: ${input.subject}

이의 취지
피신청 기관의 ${input.subject} 처분에 대하여 이의를 신청합니다.

이의 사유
${input.facts}

관계 법령
${input.legalBasis ?? "행정기본법 제36조 등"}

위와 같은 사유로 이의를 신청하오니 재검토하여 주시기 바랍니다.

${formatDate()}
신청인 ${input.clientName} (인)`;
}

function generateFromTemplate(input: DraftInput): { title: string; body: string } {
  const title = TYPE_TITLES[input.type];
  let body = "";
  switch (input.type) {
    case "appeal":
      body = templateAppeal(input);
      break;
    case "complaint":
      body = templateComplaint(input);
      break;
    case "petition":
      body = templatePetition(input);
      break;
    case "application":
      body = templateApplication(input);
      break;
    case "objection":
      body = templateObjection(input);
      break;
  }
  return { title, body };
}

async function generateWithClaude(
  input: DraftInput
): Promise<{ title: string; body: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const title = TYPE_TITLES[input.type];
  const systemPrompt = `당신은 대한민국 행정사입니다. 정확하고 격식 있는 한국 행정 문서를 작성합니다. 항상 ${title} 형식으로 작성하고, 청구취지/사실관계/관계법령/날짜/서명을 포함하세요. 마크다운은 사용하지 말고 일반 텍스트로 출력하세요.`;

  const userPrompt = `다음 정보를 바탕으로 ${title} 초안을 작성해 주세요.
- 의뢰인: ${input.clientName}
- 대상 기관: ${input.agency}
- 사건/제목: ${input.subject}
- 사실관계: ${input.facts}
- 법적 근거: ${input.legalBasis ?? "(미지정 — 적절한 일반 법령 인용)"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text =
      data.content
        ?.filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text as string)
        .join("\n")
        .trim() ?? "";
    if (!text) return null;
    return { title, body: text };
  } catch {
    return null;
  }
}

export async function generateDocumentDraft(
  input: DraftInput
): Promise<{ title: string; body: string }> {
  const aiResult = await generateWithClaude(input);
  if (aiResult) return aiResult;
  return generateFromTemplate(input);
}
