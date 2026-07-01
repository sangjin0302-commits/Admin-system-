import Link from "next/link";

type DeadlineReminderBandProps = {
  variant?: "soft" | "dark";
};

const DEADLINES = [
  { label: "행정심판 청구", value: "90일" },
  { label: "이의신청", value: "60일" },
  { label: "취소소송", value: "90일" },
];

export function DeadlineReminderBand({ variant = "soft" }: DeadlineReminderBandProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={
        isDark
          ? "ethos-grain overflow-hidden rounded-[20px] border border-gold/30 ethos-dark-card-v p-6 shadow-floating sm:p-8"
          : "ethos-card overflow-hidden rounded-[20px] border border-gold/30 p-6 sm:p-8"
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={
              isDark
                ? "font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft"
                : "font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep"
            }
          >
            Legal Deadlines
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {DEADLINES.map((d, i) => (
              <span key={d.label} className="flex items-center gap-2">
                {i > 0 && (
                  <span className={isDark ? "text-white/30" : "text-text-muted/50"}>·</span>
                )}
                <span
                  className={
                    isDark
                      ? "text-sm text-white/85"
                      : "text-sm text-text-strong"
                  }
                >
                  {d.label}{" "}
                  <strong className={isDark ? "text-gold-soft" : "text-gold-deep"}>
                    {d.value}
                  </strong>
                </span>
              </span>
            ))}
          </div>
          <p
            className={
              isDark
                ? "mt-3 text-sm leading-7 text-white/70"
                : "mt-3 text-sm leading-7 text-text-muted"
            }
          >
            기한이 지나면 되돌릴 수 없습니다.
          </p>
        </div>

        <Link
          href="/quick-check"
          data-funnel="deadline_band_quickcheck"
          className={
            isDark
              ? "ethos-cta-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 font-serif text-sm font-bold text-primary transition hover:brightness-95"
              : "ethos-cta-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-serif text-sm font-bold text-white transition hover:bg-text-strong"
          }
        >
          남은 기한 무료 확인 <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
