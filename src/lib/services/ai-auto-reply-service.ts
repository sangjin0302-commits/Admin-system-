const TEMPLATE_REPLIES: Record<string, string> = {
  FOREIGNER_VISA: `안녕하세요, ETHOS 행정사사무소입니다.

외국인 비자 관련 문의를 접수하였습니다. 비자 신청/변경을 위해 아래 서류를 준비해 주시면 보다 정확한 안내가 가능합니다:

- 여권 사본
- 외국인등록증 사본 (해당 시)
- 재직증명서 또는 사업자등록증
- 기타 체류자격별 추가 서류

자세한 상담을 원하시면 연락 주시기 바랍니다.`,

  IMMIGRATION_STAY: `안녕하세요, ETHOS 행정사사무소입니다.

체류자격 관련 문의를 접수하였습니다. 체류 연장 또는 변경 신청을 위해 다음 서류를 미리 준비해 주시면 원활한 진행이 가능합니다:

- 여권 원본
- 외국인등록증
- 체류자격별 입증 서류 (재학증명서, 재직증명서 등)
- 수수료 납부 영수증

구체적인 사안에 따라 추가 서류가 필요할 수 있으니, 편하신 시간에 상담 예약을 잡아 주세요.`,

  APOSTILLE_CONSULAR: `안녕하세요, ETHOS 행정사사무소입니다.

아포스티유/영사 인증 관련 문의를 접수하였습니다. 원활한 진행을 위해 아래 사항을 확인해 주세요:

- 인증 대상 문서 원본
- 사용 목적국 및 제출 기관
- 문서 번역 필요 여부

서류 확인 후 소요 기간 및 비용을 안내드리겠습니다.`,

  TRANSLATION_NOTARY: `안녕하세요, ETHOS 행정사사무소입니다.

번역/공증 관련 문의를 접수하였습니다. 정확한 견적을 위해 다음 정보를 알려주세요:

- 번역 대상 문서 (원본 또는 스캔본)
- 번역 언어 (예: 한→영, 영→한)
- 공증 필요 여부
- 희망 완료일

서류를 보내주시면 빠르게 견적을 안내드리겠습니다.`,

  GENERAL_ADMIN_CIVIL: `안녕하세요, ETHOS 행정사사무소입니다.

행정/민원 관련 문의를 접수하였습니다. 해당 민원의 종류와 현재 진행 상황을 파악하여 최적의 방안을 안내드리겠습니다.

구체적인 상황을 말씀해 주시면 필요한 서류 목록과 예상 소요 기간을 안내드리겠습니다.`,

  CORPORATE_REQUEST: `안녕하세요, ETHOS 행정사사무소입니다.

법인/기업 관련 문의를 접수하였습니다. 기업 행정 업무에 대해 아래 정보를 확인해 주시면 정확한 안내가 가능합니다:

- 법인 형태 (주식회사, 유한회사 등)
- 업무 종류 (설립, 변경, 인허가 등)
- 관련 서류 현황

담당자가 확인 후 연락드리겠습니다.`,

  UNKNOWN: `안녕하세요, ETHOS 행정사사무소입니다.

문의를 접수하였습니다. 보다 정확한 안내를 위해 문의 내용을 구체적으로 알려주시면 감사하겠습니다.

확인 후 담당자가 연락드리겠습니다.`,
};

export async function generateAutoReplyDraft(inquiry: {
  name: string;
  inquiryType: string;
  message: string;
  title: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      return await generateWithAI(apiKey, inquiry);
    } catch (err) {
      console.error("AI auto-reply failed, falling back to template:", err);
    }
  }

  return generateFromTemplate(inquiry);
}

function generateFromTemplate(inquiry: {
  name: string;
  inquiryType: string;
}): string {
  const template =
    TEMPLATE_REPLIES[inquiry.inquiryType] ?? TEMPLATE_REPLIES.UNKNOWN;
  return `${inquiry.name}님께,\n\n${template}\n\n감사합니다.\nETHOS 행정사사무소 드림`;
}

async function generateWithAI(
  apiKey: string,
  inquiry: { name: string; inquiryType: string; message: string; title: string },
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system:
        "You are a polite assistant for ETHOS 행정사사무소. Generate a brief Korean reply acknowledging the inquiry, providing relevant initial guidance based on the inquiry type, and asking for any additional documents needed. Keep under 200 words.",
      messages: [
        {
          role: "user",
          content: `다음 문의에 대한 답변 초안을 작성해 주세요.

문의자: ${inquiry.name}
문의 유형: ${inquiry.inquiryType}
제목: ${inquiry.title}
내용: ${inquiry.message}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  return data.content?.[0]?.text ?? generateFromTemplate(inquiry);
}
