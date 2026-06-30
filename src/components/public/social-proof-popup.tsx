"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  { city: "서울", action: "무료 검토를 요청" },
  { city: "경기", action: "D-8 비자 검토를 요청" },
  { city: "인천", action: "행정심판 상담을 예약" },
  { city: "부산", action: "체류자격 변경 검토를 요청" },
  { city: "대전", action: "귀화 상담을 신청" },
  { city: "대구", action: "법인설립 검토를 요청" },
];

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);
  const [minutesAgo, setMinutesAgo] = useState(3);

  useEffect(() => {
    // Don't show on admin/portal pages
    if (typeof window !== "undefined" &&
        (window.location.pathname.startsWith("/admin") ||
         window.location.pathname.startsWith("/portal"))) {
      return;
    }

    // Show first popup after 15 seconds
    const firstTimeout = setTimeout(() => {
      showRandomMessage();
    }, 15000);

    // Then show every 45-90 seconds
    const interval = setInterval(() => {
      showRandomMessage();
    }, 45000 + Math.random() * 45000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  function showRandomMessage() {
    const idx = Math.floor(Math.random() * MESSAGES.length);
    setMessage(MESSAGES[idx]);
    setMinutesAgo(Math.floor(Math.random() * 12) + 1);
    setVisible(true);

    setTimeout(() => setVisible(false), 5000);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-40 animate-in slide-in-from-left-full duration-500 sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-surface px-4 py-3 shadow-floating">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">
          ✓
        </span>
        <div>
          <p className="text-sm font-bold text-primary">
            {message.city}에서 {message.action}했습니다
          </p>
          <p className="text-xs text-text-muted">{minutesAgo}분 전</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 text-xs text-text-muted hover:text-primary"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
