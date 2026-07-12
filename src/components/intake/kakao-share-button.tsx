"use client";
import { useEffect, useState } from "react";

interface Props { inquiryNumber: string; }

export function KakaoShareButton({ inquiryNumber }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Kakao) {
      if (!(window as any).Kakao.isInitialized()) {
        (window as any).Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "");
      }
      setReady(true);
    }
  }, []);

  const share = () => {
    if (!ready) return;
    (window as any).Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "ETHOS 행정사사무소 — 접수 완료",
        description: `접수번호: ${inquiryNumber}. 포털에서 진행상황을 확인하세요.`,
        imageUrl: "https://ethosattorney.com/logo.webp",
        link: { mobileWebUrl: `https://ethosattorney.com/portal`, webUrl: `https://ethosattorney.com/portal` },
      },
      buttons: [{ title: "진행상황 확인", link: { mobileWebUrl: `https://ethosattorney.com/portal`, webUrl: `https://ethosattorney.com/portal` } }],
    });
  };

  if (!ready) return null;
  return (
    <button onClick={share} className="inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-5 py-2.5 text-sm font-bold text-[#191919] transition hover:bg-[#FDD835]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.9 3.35c-.08.3.26.54.52.37l3.92-2.6c.58.08 1.18.13 1.8.13 5.52 0 10-3.58 10-7.92S17.52 3 12 3z"/></svg>
      카카오톡 공유
    </button>
  );
}
