"use client";

import Script from "next/script";
import { useState } from "react";

type Address = {
  zonecode: string;
  address: string;
  addressType: "R" | "J";
  buildingName?: string;
  apartment?: "Y" | "N";
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: { oncomplete: (data: Address) => void }) => { open: () => void };
    };
  }
}

type Props = {
  onSelect: (full: { zonecode: string; address: string }) => void;
};

/**
 * 다음(카카오) 우편번호 검색 — 무료, API 키 불필요.
 * 외부 script (postcode.v2.js) 로드 후 popup으로 검색.
 */
export function DaumPostcodeButton({ onSelect }: Props) {
  const [scriptReady, setScriptReady] = useState(false);

  function openSearch() {
    if (!scriptReady || !window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete(data) {
        onSelect({
          zonecode: data.zonecode,
          address: data.address
        });
      }
    }).open();
  }

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={openSearch}
        disabled={!scriptReady}
        className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-semibold text-primary hover:bg-gold-soft/30 disabled:opacity-50"
      >
        주소 검색
      </button>
    </>
  );
}
