/**
 * 웹폰트 로딩 — 영문 디스플레이(Playfair)만 next/font/google 로 자체 호스팅한다.
 *
 * 한글 폰트는 **시스템 폰트**를 쓴다(globals.css :root 의 --font-display-ko/--font-body-ko).
 * 예전엔 Noto Sans KR·Nanum Myeongjo 를 next/font 로 받았는데, 한글은 unicode-range
 * 서브셋이 100+ 조각으로 분할돼 한 페이지에서 woff2 를 150개+ 다운로드하며 로딩을
 * 크게 느리게 했다(preload:false 로도 lazy 로드 100+가 남아 근본해결 안 됨).
 * 시스템 폰트로 전환해 한글 폰트 다운로드를 0 으로 만든다. 영문 제목만 Playfair 유지.
 */

import { Playfair_Display } from "next/font/google";

/** 영문 디스플레이 — 제목·에디토리얼 요소. latin 서브셋이라 파일 소수, preload 유지. */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-display-latin",
});

/** <html> 에 붙이는 클래스. 한글 변수는 globals.css :root 에서 시스템 폰트로 정의됨. */
export const fontVariables = playfair.variable;
