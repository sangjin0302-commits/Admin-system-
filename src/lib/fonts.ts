/**
 * 웹폰트 로딩 — next/font/google 로 빌드 시 자체 호스팅한다.
 *
 * 예전에는 globals.css 첫 줄에서 Google Fonts 를 @import 했다. 그러면
 * 브라우저가 CSS 를 받아 파싱한 뒤에야 폰트 CSS 의 존재를 알고, 다시 폰트
 * 파일을 받는다 — 글자가 제 모습이 되기까지 직렬 왕복이 세 번 일어난다.
 * 방문자가 급한 상태(기한·거절 통지)로 들어오는 사이트에서 이건 그대로 체감된다.
 *
 * next/font 로 바꾸면:
 *   - 폰트가 빌드 시 우리 도메인으로 내려와 외부 왕복이 사라진다
 *   - 크기 조정 폴백을 자동 생성해 글자 튐(레이아웃 이동)이 없어진다
 *   - 방문자 브라우저가 Google 에 요청하지 않는다(개인정보 측면)
 *
 * 한글 본문은 예전에 시스템 폰트로 떨어져 기기마다 다르게 보였다.
 * Noto Sans KR 을 명시해 통일한다. (Pretendard 가 더 낫지만 변수 폰트가
 * 2MB 단일 파일이라, 유니코드 서브셋이 자동 분할되는 Noto 를 택했다.)
 */

import { Playfair_Display, Nanum_Myeongjo, Noto_Sans_KR } from "next/font/google";

/** 영문 디스플레이 — 제목·에디토리얼 요소. */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-display-latin",
});

/**
 * 한글 명조 — 제목에서 영문 디스플레이와 짝을 이룬다.
 * preload:false 필수 — 한글 폰트는 unicode-range 서브셋이 100+ 조각으로 쪼개지는데
 * preload(기본 true)면 그 전부를 <link rel=preload>로 강제 다운로드해 첫 로딩을 막는다.
 * false 로 두면 브라우저가 화면에 실제 뜬 글자의 서브셋만 lazy 로드한다.
 */
export const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
  variable: "--font-display-ko",
});

/**
 * 한글 본문. 400/500/700 만 받는다 — 굵기를 늘릴수록 내려받는 용량이 늘고,
 * 지금 화면에서 실제로 쓰는 굵기는 이 셋뿐이다.
 * preload:false — 위 nanumMyeongjo 와 동일 이유(CJK 서브셋 100+ 조각 대량 preload 방지).
 */
export const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-body-ko",
});

/** <html> 에 한 번에 붙이는 클래스. */
export const fontVariables = [
  playfair.variable,
  nanumMyeongjo.variable,
  notoSansKr.variable,
].join(" ");
