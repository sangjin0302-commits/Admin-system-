"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";

/**
 * 관리자 — 인쇄용 브로슈어 미리보기 · 다운로드.
 *
 * 서버 API `/api/admin/brochure/download` 을 iframe 으로 미리보기,
 * 재생성 버튼은 캐시 무효화용 timestamp 로 iframe 재로드.
 */
export default function AdminBrochurePage() {
  const [version, setVersion] = useState(0);
  const previewSrc = `/api/admin/brochure/download?v=${version}`;

  function regenerate() {
    setVersion((v) => v + 1);
  }

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">인쇄용 브로슈어</h2>
      <p className="mt-2 text-sm text-text-muted">
        4페이지 A4 브로슈어(PDF)를 자동 생성합니다. 사이트 설정(전화·이메일·주소)이 반영되며,
        설정 변경 후에는 <b>재생성</b> 버튼으로 최신본을 확인하세요.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={`/api/admin/brochure/download?download=1&v=${version}`}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
        >
          PDF 다운로드
        </a>
        <button
          type="button"
          onClick={regenerate}
          className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-text-strong hover:bg-surface-muted"
        >
          재생성 (설정 변경 시)
        </button>
        <a
          href={previewSrc}
          target="_blank"
          rel="noopener"
          className="text-sm font-semibold text-primary underline underline-offset-4"
        >
          새 창에서 열기 ↗
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-[#f4f6f8]">
        <iframe
          key={version}
          src={previewSrc}
          title="브로슈어 미리보기"
          className="h-[820px] w-full border-0"
        />
      </div>
    </section>
  );
}
