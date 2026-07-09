const COMPLEX_TYPES = new Set([
  "ADMIN_APPEAL",
  "CONTRACT_INVESTIGATION",
]);

const THRESHOLD_DEFAULT = 30;
const THRESHOLD_COMPLEX = 60;

export function CaseDelayBadge({
  caseId: _caseId,
  createdAt,
  matterType,
  enabled = true,
}: {
  caseId: string;
  createdAt: Date;
  matterType: string;
  enabled?: boolean;
}) {
  if (!enabled) return null;

  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const threshold = COMPLEX_TYPES.has(matterType)
    ? THRESHOLD_COMPLEX
    : THRESHOLD_DEFAULT;

  if (days <= threshold) return null;

  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
      🔴 지연
    </span>
  );
}
