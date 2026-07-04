import { getKakaoChatUrl } from "@/lib/utils/kakao-deep-link";

/** Kakao channel public ID — used for deep link generation */
export const KAKAO_CHANNEL_ID = "_xnQLnX";

export const CHANNELS = {
  naverTalk: { label: "네이버 톡톡", url: "http://talk.naver.com/WP044ZF", short: "톡톡" },
  kakao: {
    label: "카카오 채팅",
    /** Static fallback URL (desktop). For dynamic deep link use getKakaoChatUrl(KAKAO_CHANNEL_ID). */
    url: "https://pf.kakao.com/_xnQLnX/chat",
    short: "카카오",
    channelId: KAKAO_CHANNEL_ID,
    /** Returns device-appropriate URL (mobile deep link or desktop web) */
    getUrl: (options?: { category?: string; source?: string }) =>
      getKakaoChatUrl(KAKAO_CHANNEL_ID, options)
  },
  email: { label: "이메일", url: "mailto:a.attorneyjean@gmail.com", value: "a.attorneyjean@gmail.com", short: "이메일" },
  telegram: { label: "텔레그램", url: "https://t.me/EthosAdmin", value: "@EthosAdmin", short: "텔레그램" },
  naverExpert: { label: "네이버 엑스퍼트", url: "https://m.expert.naver.com/expert/profile/home?storeId=100060507", short: "엑스퍼트" }
} as const;

export const CONSULT_TAGLINE = "무료 검토 · 상담 유료 · 수임 시 차감";
export const REVIEW_RANGE = "1. 견적·비용 범위 안내  2. 핵심 질문 1~2가지 답변";
