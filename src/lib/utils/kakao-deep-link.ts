/**
 * Kakao Talk Channel deep link utility.
 *
 * - Mobile: opens Kakao app directly via `kakaoplus://` scheme
 * - Desktop: falls back to `https://pf.kakao.com/{id}/chat`
 */

type KakaoChatOptions = {
  category?: string;
  source?: string;
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Returns the appropriate Kakao chat URL based on device type.
 *
 * @param channelId - Kakao channel public ID (e.g. "_xnQLnX")
 * @param options - Optional tracking params
 */
export function getKakaoChatUrl(
  channelId: string,
  options?: KakaoChatOptions
): string {
  const base = isMobile()
    ? `kakaoplus://plusfriend/chat/${channelId}`
    : `https://pf.kakao.com/${channelId}/chat`;

  if (!options?.category && !options?.source) return base;

  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.source) params.set("source", options.source);

  return `${base}?${params.toString()}`;
}
