import * as Sentry from "@sentry/nextjs";

/**
 * 브라우저(클라이언트) 에러 수집.
 *
 * 무료 티어가 월 5,000 이벤트라, 우리가 고칠 수 없는 잡음이 할당량을 먹지 않도록
 * 아래 두 단계로 거른다.
 *   1) ignoreErrors — 메시지 패턴이 명확한 것
 *   2) beforeSend  — 스택트레이스 출처가 확장 프로그램인 것
 */

/**
 * 우리 코드로는 고칠 수 없는 알려진 잡음.
 *
 * parentNode/removeChild 계열이 여기 있는 이유: 크롬 번역이나 광고차단 확장이
 * 텍스트 노드를 통째로 바꿔치기하면, React가 들고 있던 노드의 parentNode가
 * null이 되어 재조정 중 터진다. 방문자 브라우저 쪽 문제라 코드로 못 막는다.
 * (사이트 자체 원인은 <html lang>을 실제 언어와 맞춰 오탐 번역을 줄이는 쪽으로 대응)
 */
const IGNORED_ERRORS: (string | RegExp)[] = [
  // 브라우저 번역·확장이 DOM을 갈아치워 React 재조정이 깨지는 경우
  /Cannot read properties of null \(reading 'parentNode'\)/i,
  /Cannot read property 'parentNode' of null/i,
  /Failed to execute 'removeChild' on 'Node'/i,
  /Failed to execute 'insertBefore' on 'Node'/i,
  /The node to be removed is not a child of this node/i,

  // 네트워크 끊김·탭 종료 — 사용자 환경 문제
  /Load failed/i,
  /NetworkError when attempting to fetch resource/i,
  /Failed to fetch/i,
  /AbortError/i,

  // 브라우저·확장 자체 잡음
  /ResizeObserver loop/i,
  "top.GLOBALS",
  /^Script error\.?$/,
  /Non-Error promise rejection captured/i,
  /webkitExitFullScreen/i,

  // 크롬 확장·인앱 브라우저(카카오/네이버 등) 주입 스크립트
  /chrome-extension:/i,
  /moz-extension:/i,
  /safari-extension:/i
];

/** 스택 프레임이 확장 프로그램/외부 주입 스크립트에서 온 것인지. */
function isFromBrowserExtension(event: Sentry.ErrorEvent): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (!frames?.length) return false;
  return frames.some((f) => {
    const file = f.filename ?? "";
    return (
      file.startsWith("chrome-extension://") ||
      file.startsWith("moz-extension://") ||
      file.startsWith("safari-extension://") ||
      file.startsWith("safari-web-extension://") ||
      file.includes("extensions/")
    );
  });
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // 성능 추적은 10%만 — 이벤트 할당량 절약
  tracesSampleRate: 0.1,

  // 세션 리플레이는 오류 발생 시에만 (평상시 녹화 안 함)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  ignoreErrors: IGNORED_ERRORS,

  // 확장 프로그램이 주입한 스크립트에서 발생한 오류는 아예 보내지 않는다
  denyUrls: [/chrome-extension:\/\//i, /moz-extension:\/\//i, /safari-extension:\/\//i],

  beforeSend(event) {
    if (isFromBrowserExtension(event)) return null;
    return event;
  },

  integrations: [
    // 의뢰인 개인정보가 리플레이에 남지 않도록 전체 마스킹
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })
  ]
});
