interface Props { summary: string; readingTimeMin: number; }

export function BlogSummaryCard({ summary, readingTimeMin }: Props) {
  return (
    <div className="mb-8 rounded-xl border border-gold/30 bg-gold-soft/20 p-5">
      <div className="flex items-center gap-2 text-xs font-bold text-gold-deep">
        <span>📝 AI 요약</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{readingTimeMin}분 읽기</span>
      </div>
      <p className="mt-2 text-sm leading-7 text-text">{summary}</p>
    </div>
  );
}
