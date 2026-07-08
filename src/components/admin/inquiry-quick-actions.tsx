"use client";

/**
 * 문의 상세 상단에 배치하는 원클릭 액션 chips.
 * - 카톡 딥링크: kakaotalk://plusfriend/chat/{KAKAO_CHANNEL_ID}
 * - 전화: tel:
 * - 이메일: mailto:
 * - 다음 액션 chips: 답장/견적/상담예약/거절 (localStorage 기반 최근 액션 하이라이트)
 *
 * Feature flags:
 *   - inquiry_kakao_deeplink_action
 *   - inquiry_next_action_chips
 */

import { useEffect, useState } from "react";
import Link from "next/link";

export type InquiryQuickActionsProps = {
  inquiryId: string;
  phone?: string | null;
  email?: string | null;
  kakaoChannelId?: string | null;
  kakaoEnabled?: boolean;
  chipsEnabled?: boolean;
};

const NEXT_ACTIONS = [
  { key: "reply", label: "답장", href: (id: string) => `/admin/inquiries/${id}?compose=reply` },
  { key: "quote", label: "견적 안내", href: (id: string) => `/admin/quote-calc?inquiryId=${id}` },
  { key: "book", label: "상담 예약", href: (id: string) => `/admin/inquiries/${id}?compose=booking` },
  { key: "decline", label: "정중 거절", href: (id: string) => `/admin/inquiries/${id}?compose=decline` },
] as const;

const LS_KEY = "admin.inquiry.recent_action";

export function InquiryQuickActions(props: InquiryQuickActionsProps) {
  const { inquiryId, phone, email, kakaoChannelId, kakaoEnabled, chipsEnabled } = props;
  const [recent, setRecent] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRecent(localStorage.getItem(LS_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const rememberAction = (key: string) => {
    try {
      localStorage.setItem(LS_KEY, key);
      setRecent(key);
    } catch {
      /* ignore */
    }
  };

  const kakaoHref = kakaoChannelId ? `kakaotalk://plusfriend/chat/${kakaoChannelId}` : null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-muted p-3">
      {phone ? (
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted"
        >
          📞 전화
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted"
        >
          ✉️ 이메일
        </a>
      ) : null}
      {kakaoEnabled && kakaoHref ? (
        <a
          href={kakaoHref}
          className="inline-flex items-center gap-1 rounded-full border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-900 hover:bg-yellow-100"
        >
          💬 카톡 채널
        </a>
      ) : null}
      {chipsEnabled ? (
        <>
          <span className="ml-1 h-4 w-px bg-line" aria-hidden />
          <span className="text-xs text-text-muted">다음 액션:</span>
          {NEXT_ACTIONS.map((a) => {
            const isRecent = recent === a.key;
            return (
              <Link
                key={a.key}
                href={a.href(inquiryId)}
                onClick={() => rememberAction(a.key)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isRecent
                    ? "border border-black bg-black text-white"
                    : "border border-line bg-surface text-text hover:bg-surface-muted"
                }`}
              >
                {a.label}
              </Link>
            );
          })}
        </>
      ) : null}
    </div>
  );
}
