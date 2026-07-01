import Link from "next/link";
import { getTopNextActions, type NextAction } from "@/lib/services/next-actions-service";
import { logger } from "@/lib/utils/logger";

async function safeGetTopNextActions(): Promise<NextAction[]> {
  try {
    return await getTopNextActions(10);
  } catch (error) {
    logger.error("Failed to load next actions", error);
    return [];
  }
}

const URGENCY_STYLES: Record<NextAction["urgency"], { badge: string; label: string }> = {
  high: { badge: "bg-red-100 text-red-700 border border-red-200", label: "긴급" },
  medium: { badge: "bg-amber-100 text-amber-700 border border-amber-200", label: "주의" },
  low: { badge: "bg-slate-100 text-slate-600 border border-slate-200", label: "보통" },
};

export async function NextActionsPanel() {
  const actions = await safeGetTopNextActions();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            🎯 AI 추천 다음 액션
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Lawbot 분석 기반 우선순위 액션 Top {actions.length || 10}
          </p>
        </div>
      </header>

      {actions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          AI가 추천한 액션이 없습니다. Lawbot 분석이 필요한 문의를 먼저 처리하세요.
        </div>
      ) : (
        <ul className="space-y-2">
          {actions.map((a, idx) => {
            const style = URGENCY_STYLES[a.urgency];
            return (
              <li
                key={`${a.inquiryId}-${idx}`}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50"
              >
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
                >
                  {style.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <Link
                      href={`/admin/inquiries/${a.inquiryId}`}
                      className="max-w-[260px] truncate font-medium text-slate-800 hover:text-indigo-600 hover:underline"
                    >
                      {a.inquiryTitle}
                    </Link>
                    {a.contactName ? (
                      <span className="text-slate-400">· {a.contactName}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-snug text-slate-700">{a.action}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
