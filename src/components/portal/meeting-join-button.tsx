"use client";

/**
 * "화상 상담 참여" 버튼 (portal case detail 페이지에서 사용).
 * 예약된 화상 미팅 URL 이 있을 때만 렌더링.
 */

type Props = {
  joinUrl: string | null | undefined;
  provider?: string | null;
  scheduledAt?: string | null;
  compact?: boolean;
};

export function MeetingJoinButton({ joinUrl, provider, scheduledAt, compact }: Props) {
  if (!joinUrl) return null;

  const label = provider === "zoom"
    ? "Zoom 참여"
    : provider === "google"
      ? "Google Meet 참여"
      : "화상 상담 참여";

  if (compact) {
    return (
      <a
        href={joinUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-text-strong"
      >
        <span aria-hidden>🎥</span> {label}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-gold/40 bg-surface p-4 shadow-panel">
      <p className="font-serif text-sm font-bold text-primary">화상 상담 예약</p>
      {scheduledAt ? (
        <p className="mt-1 text-xs text-text-muted">일시: {scheduledAt}</p>
      ) : null}
      <a
        href={joinUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-text-strong"
      >
        <span aria-hidden>🎥</span> {label}
      </a>
      <p className="mt-2 text-[11px] leading-4 text-text-muted">
        상담 시각에 링크를 눌러 참여하세요. 카메라 · 마이크 권한을 허용해 주세요.
      </p>
    </div>
  );
}

export default MeetingJoinButton;
