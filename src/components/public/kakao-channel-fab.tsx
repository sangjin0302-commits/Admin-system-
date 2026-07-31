import { getSiteSetting } from "@/lib/services/site-settings";

const FALLBACK_KAKAO = "http://pf.kakao.com/_xnQLnX";

/**
 * 카카오톡 채널 플로팅 버튼(우하단). AI 챗 대신 실제 상담 채널로 안내.
 * URL 은 admin `contact.kakaoUrl` 설정값 → 없으면 기본 채널.
 * 서버 컴포넌트라 클라이언트 JS 불필요(단순 링크).
 */
export async function KakaoChannelFab() {
  const url = (await getSiteSetting("contact.kakaoUrl"))?.trim() || FALLBACK_KAKAO;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="카카오톡 채널로 상담하기"
      className="fixed bottom-24 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#FEE500] px-4 shadow-lg transition hover:scale-105 sm:bottom-28 sm:right-6"
    >
      {/* 카카오 말풍선 아이콘 */}
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="#3C1E1E">
        <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.77 1.86 5.2 4.66 6.58-.15.53-.96 3.3-.99 3.52 0 0-.02.17.09.23.11.07.24.02.24.02.32-.04 3.7-2.42 4.28-2.83.56.08 1.14.13 1.72.13 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
      </svg>
      <span className="text-sm font-bold text-[#3C1E1E]">카톡 상담</span>
    </a>
  );
}
