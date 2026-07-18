"use client";

/**
 * setup 페이지의 "바로가기" 외부 링크.
 * <details>/<summary> 안에 있어서 클릭 시 토글되지 않도록 stopPropagation 필요 →
 * onClick(이벤트 핸들러)은 클라이언트 컴포넌트에서만 넘길 수 있으므로 분리.
 */
export function SetupLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-bold text-primary hover:bg-gold-soft/30"
    >
      바로가기 ↗
    </a>
  );
}
