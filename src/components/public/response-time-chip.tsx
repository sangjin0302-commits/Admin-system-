/**
 * 검토 응답 시간 chip.
 * - 지금은 정적 표시 (zero-state safe)
 * - 향후 Inquiry 모델에 firstResponseAt 필드 추가 시 평균 계산으로 전환
 */
export function ResponseTimeChip() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      영업일 24시간 내 검토 회신
    </span>
  );
}
