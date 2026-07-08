/**
 * QQ3: 사건 진행률 5단계 progress bar.
 *
 * 15개 CaseMatterStatus → 5단계 그룹핑:
 *   1. 접수/상담 (INTAKE_REVIEW, CONSULTING, QUOTED, CONTRACT_PENDING)
 *   2. 착수 (OPEN, DOCUMENT_COLLECTING, DOCUMENT_REVIEWING)
 *   3. 제출 (READY_TO_SUBMIT, SUBMITTED, SUPPLEMENT_REQUESTED)
 *   4. 처리 대기 (WAITING_AGENCY, RESULT_RECEIVED)
 *   5. 종결 (CLOSING, CLOSED)
 *   CANCELLED은 별도 취소 상태
 *
 * Feature flag: `case_progress_visualization`
 */

const STAGES: Array<{ key: string; label: string; statuses: string[] }> = [
  { key: "intake", label: "접수/상담", statuses: ["INTAKE_REVIEW", "CONSULTING", "QUOTED", "CONTRACT_PENDING"] },
  { key: "open", label: "착수", statuses: ["OPEN", "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING"] },
  { key: "submit", label: "제출", statuses: ["READY_TO_SUBMIT", "SUBMITTED", "SUPPLEMENT_REQUESTED"] },
  { key: "waiting", label: "처리 대기", statuses: ["WAITING_AGENCY", "RESULT_RECEIVED"] },
  { key: "close", label: "종결", statuses: ["CLOSING", "CLOSED"] },
];

export function CaseProgressBar({ status, showLabels = true }: { status: string; showLabels?: boolean }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-medium text-danger">
        ⛔ 취소된 사건
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.statuses.includes(status));
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={s.key} className="flex-1">
              <div
                className={`h-2 rounded-full transition ${
                  done ? "bg-emerald-500" : active ? "bg-primary" : "bg-line"
                }`}
                title={s.label}
              />
            </div>
          );
        })}
      </div>
      {showLabels ? (
        <div className="grid grid-cols-5 gap-1 text-[10px] font-medium">
          {STAGES.map((s, i) => {
            const active = i === activeIdx;
            return (
              <div
                key={s.key}
                className={`text-center truncate ${
                  active ? "text-primary font-bold" : i < activeIdx ? "text-emerald-600" : "text-text-muted"
                }`}
              >
                {i < activeIdx ? "✓ " : active ? "▶ " : ""}
                {s.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
