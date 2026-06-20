import { logger } from "@/lib/utils/logger";
export type NaverMessage = {
  userId: string;
  message: string;
  quickReplies?: string[];
};

const PARTNER_ID = process.env.NAVER_TALKTALK_PARTNER_ID;
const TOKEN = process.env.NAVER_TALKTALK_TOKEN;

export async function sendMessage(msg: NaverMessage): Promise<boolean> {
  if (!TOKEN) {
    logger.debug("[naver-talktalk:mock] send", msg);
    return true;
  }
  try {
    const res = await fetch(
      `https://gw.talk.naver.com/chatbot/v1/event?partnerId=${PARTNER_ID ?? ""}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          event: "send",
          user: msg.userId,
          textContent: { text: msg.message },
          options: msg.quickReplies
            ? {
                quickReply: {
                  items: msg.quickReplies.map((label) => ({
                    title: label,
                    action: "message",
                    messageText: label,
                  })),
                },
              }
            : undefined,
        }),
      }
    );
    return res.ok;
  } catch (err) {
    logger.error("[naver-talktalk] sendMessage error", err);
    return false;
  }
}

export async function handleIncomingMessage(
  payload: any
): Promise<{ reply: string }> {
  const text: string = payload?.textContent?.text ?? payload?.message ?? "";
  const userId: string = payload?.user ?? payload?.userId ?? "unknown";

  let reply = "안녕하세요. 무엇을 도와드릴까요?";
  if (/문의|상담/.test(text)) {
    reply = "상담 문의를 접수해 드리겠습니다. 성함과 연락처를 알려주세요.";
  } else if (/요금|비용/.test(text)) {
    reply = "비용은 사건 유형에 따라 다릅니다. 상담을 통해 안내드립니다.";
  } else if (/위치|주소/.test(text)) {
    reply = "사무소 위치 안내는 홈페이지 하단에서 확인 가능합니다.";
  }

  await sendMessage({ userId, message: reply });
  return { reply };
}

export async function notifyInquiryToNaver(
  userId: string,
  name: string,
  trackingCode: string
): Promise<boolean> {
  return sendMessage({
    userId,
    message: `${name}님, 문의가 정상 접수되었습니다. 추적 코드: ${trackingCode}`,
    quickReplies: ["진행 상태 확인", "추가 문의"],
  });
}
