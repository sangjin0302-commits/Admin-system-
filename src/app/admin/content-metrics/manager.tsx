"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PRACTICE_AREAS } from "@/lib/practice-areas";
import type {
  WeekRecord,
  AreaRankRow,
  TopItemInput,
  MetricChannel
} from "@/lib/services/content-metrics-service";

const AREA_SUGGESTIONS = Array.from(
  new Set([
    ...PRACTICE_AREAS.map((a) => a.label),
    "인허가",
    "계약서",
    "출입국",
    "비영리법인",
    "중동분야",
    "행정심판"
  ])
);

type TopRow = { rank: number; title: string; area: string; views: string };

const emptyTop = (rank: number): TopRow => ({ rank, title: "", area: "", views: "" });

type FormState = {
  weekStart: string;
  weekEnd: string;
  updatedOn: string;
  naverViews: string;
  naverRevisitRate: string;
  naverAiCitations: string;
  naverInquiries: string;
  naverInquiryNote: string;
  liImpressions: string;
  liMemberReach: string;
  liFollowers: string;
  liFollowerDelta: string;
  insight: string;
  referral: { label: string; pct: string }[];
  naverTop: TopRow[];
  liTop: TopRow[];
};

const EMPTY_FORM: FormState = {
  weekStart: "",
  weekEnd: "",
  updatedOn: "",
  naverViews: "",
  naverRevisitRate: "",
  naverAiCitations: "",
  naverInquiries: "",
  naverInquiryNote: "",
  liImpressions: "",
  liMemberReach: "",
  liFollowers: "",
  liFollowerDelta: "",
  insight: "",
  referral: [
    { label: "", pct: "" },
    { label: "", pct: "" },
    { label: "", pct: "" }
  ],
  naverTop: [emptyTop(1), emptyTop(2), emptyTop(3)],
  liTop: [emptyTop(1), emptyTop(2), emptyTop(3)]
};

function num(s: string): string {
  return s.trim();
}

function fmt(n: number | null): string {
  return n === null || n === undefined ? "—" : n.toLocaleString("ko-KR");
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null;
  const up = value > 0;
  const flat = value === 0;
  const color = flat ? "text-text-muted" : up ? "text-emerald-600" : "text-rose-600";
  const sign = up ? "▲" : flat ? "—" : "▼";
  return (
    <span className={`ml-1 text-[11px] font-semibold ${color}`}>
      {sign} {Math.abs(value).toLocaleString("ko-KR")}
    </span>
  );
}

export function ContentMetricsManager({
  initialWeeks,
  initialRanking
}: {
  initialWeeks: WeekRecord[];
  initialRanking: AreaRankRow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const latestWeek = initialWeeks[0]?.weekStart ?? null;

  const referralTotal = useMemo(
    () => form.referral.reduce((s, r) => s + (parseFloat(r.pct) || 0), 0),
    [form.referral]
  );

  function loadWeek(w: WeekRecord) {
    setForm({
      weekStart: w.weekStart,
      weekEnd: w.weekEnd ?? "",
      updatedOn: w.updatedOn ?? "",
      naverViews: w.naverViews?.toString() ?? "",
      naverRevisitRate: w.naverRevisitRate?.toString() ?? "",
      naverAiCitations: w.naverAiCitations?.toString() ?? "",
      naverInquiries: w.naverInquiries?.toString() ?? "",
      naverInquiryNote: w.naverInquiryNote ?? "",
      liImpressions: w.liImpressions?.toString() ?? "",
      liMemberReach: w.liMemberReach?.toString() ?? "",
      liFollowers: w.liFollowers?.toString() ?? "",
      liFollowerDelta: w.liFollowerDelta?.toString() ?? "",
      insight: w.insight ?? "",
      referral:
        w.naverReferral.length > 0
          ? w.naverReferral.map((r) => ({ label: r.label, pct: r.pct.toString() }))
          : EMPTY_FORM.referral.map((r) => ({ ...r })),
      naverTop: fillTop(w.topItems, "NAVER"),
      liTop: fillTop(w.topItems, "LINKEDIN")
    });
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillTop(items: TopItemInput[], channel: MetricChannel): TopRow[] {
    const rows = items
      .filter((t) => t.channel === channel)
      .sort((a, b) => a.rank - b.rank)
      .map((t) => ({ rank: t.rank, title: t.title, area: t.area ?? "", views: t.views?.toString() ?? "" }));
    while (rows.length < 3) rows.push(emptyTop(rows.length + 1));
    return rows;
  }

  async function save() {
    if (!form.weekStart.trim()) {
      setError("기준 주 시작일은 필수입니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const buildTop = (rows: TopRow[], channel: MetricChannel) =>
        rows
          .filter((r) => r.title.trim())
          .map((r) => ({ channel, rank: r.rank, title: r.title, area: r.area, views: num(r.views) }));

      const body = {
        weekStart: num(form.weekStart),
        weekEnd: num(form.weekEnd),
        updatedOn: num(form.updatedOn),
        naverViews: num(form.naverViews),
        naverRevisitRate: num(form.naverRevisitRate),
        naverAiCitations: num(form.naverAiCitations),
        naverInquiries: num(form.naverInquiries),
        naverInquiryNote: num(form.naverInquiryNote),
        liImpressions: num(form.liImpressions),
        liMemberReach: num(form.liMemberReach),
        liFollowers: num(form.liFollowers),
        liFollowerDelta: num(form.liFollowerDelta),
        insight: num(form.insight),
        naverReferral: form.referral
          .filter((r) => r.label.trim() && r.pct.trim())
          .map((r) => ({ label: r.label.trim(), pct: parseFloat(r.pct) || 0 })),
        topItems: [...buildTop(form.naverTop, "NAVER"), ...buildTop(form.liTop, "LINKEDIN")]
      };

      const res = await fetch("/api/admin/content-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "저장 실패");
        return;
      }
      setForm({ ...EMPTY_FORM });
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("이 주간 기록을 삭제할까요?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/content-metrics?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold focus:outline-none";
  const labelCls = "block text-xs font-medium text-text-muted mb-1";

  return (
    <div className="space-y-8">
      {/* ===== 입력 폼 ===== */}
      <div className="rounded-xl border border-line bg-surface-muted p-5">
        <h3 className="text-sm font-bold text-text-strong">주간 지표 입력 · 수정</h3>
        <p className="mt-1 text-xs text-text-muted">
          같은 &ldquo;기준 주 시작일&rdquo;로 저장하면 덮어쓰기됩니다. 아래 기록에서 &ldquo;불러오기&rdquo;로 수정하세요.
        </p>

        <datalist id="area-suggestions">
          {AREA_SUGGESTIONS.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>

        {/* 기간 */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>기준 주 시작일 *</label>
            <input type="date" className={inputCls} value={form.weekStart} onChange={(e) => set({ weekStart: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>종료일</label>
            <input type="date" className={inputCls} value={form.weekEnd} onChange={(e) => set({ weekEnd: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>업데이트 기준일</label>
            <input type="date" className={inputCls} value={form.updatedOn} onChange={(e) => set({ updatedOn: e.target.value })} />
          </div>
        </div>

        {/* 네이버 */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">네이버 블로그</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className={labelCls}>조회수</label>
              <input inputMode="numeric" className={inputCls} value={form.naverViews} onChange={(e) => set({ naverViews: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>재방문율 %</label>
              <input inputMode="decimal" className={inputCls} value={form.naverRevisitRate} onChange={(e) => set({ naverRevisitRate: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>AI 인용 누적</label>
              <input inputMode="numeric" className={inputCls} value={form.naverAiCitations} onChange={(e) => set({ naverAiCitations: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>문의 건수</label>
              <input inputMode="numeric" className={inputCls} value={form.naverInquiries} onChange={(e) => set({ naverInquiries: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>유입 글 메모</label>
              <input className={inputCls} value={form.naverInquiryNote} onChange={(e) => set({ naverInquiryNote: e.target.value })} />
            </div>
          </div>

          {/* 유입 채널 */}
          <div className="mt-3">
            <label className={labelCls}>유입 채널 분포 (합계 {referralTotal.toFixed(1)}%)</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {form.referral.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="채널명 (예: 네이버통합검색_모바일)"
                    className={inputCls}
                    value={r.label}
                    onChange={(e) => {
                      const next = [...form.referral];
                      next[i] = { ...next[i], label: e.target.value };
                      set({ referral: next });
                    }}
                  />
                  <input
                    placeholder="%"
                    inputMode="decimal"
                    className="w-20 rounded-lg border border-line bg-surface px-2 py-2 text-sm focus:border-gold focus:outline-none"
                    value={r.pct}
                    onChange={(e) => {
                      const next = [...form.referral];
                      next[i] = { ...next[i], pct: e.target.value };
                      set({ referral: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 네이버 TOP */}
          <TopEditor title="네이버 TOP 3" rows={form.naverTop} onChange={(rows) => set({ naverTop: rows })} viewsLabel="조회수" />
        </div>

        {/* LinkedIn */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">LinkedIn (영문)</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>노출수</label>
              <input inputMode="numeric" className={inputCls} value={form.liImpressions} onChange={(e) => set({ liImpressions: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>회원 도달</label>
              <input inputMode="numeric" className={inputCls} value={form.liMemberReach} onChange={(e) => set({ liMemberReach: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>팔로워</label>
              <input inputMode="numeric" className={inputCls} value={form.liFollowers} onChange={(e) => set({ liFollowers: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>팔로워 증감</label>
              <input inputMode="numeric" className={inputCls} value={form.liFollowerDelta} onChange={(e) => set({ liFollowerDelta: e.target.value })} />
            </div>
          </div>
          <TopEditor title="LinkedIn TOP 3" rows={form.liTop} onChange={(rows) => set({ liTop: rows })} viewsLabel="노출수" />
        </div>

        {/* 인사이트 */}
        <div className="mt-6">
          <label className={labelCls}>이번 주 인사이트 (1~2줄)</label>
          <textarea className={inputCls} rows={2} value={form.insight} onChange={(e) => set({ insight: e.target.value })} />
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "저장 중…" : "주간 지표 저장"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setError(null);
            }}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted"
          >
            초기화
          </button>
        </div>
      </div>

      {/* ===== 분야 우선순위 통계 ===== */}
      <div>
        <h3 className="text-sm font-bold text-text-strong">분야(소재) 우선순위</h3>
        <p className="mt-1 text-xs text-text-muted">모든 주의 TOP 게시물을 분야별로 합산 — 어떤 분야가 조회/노출을 주도하는지.</p>
        {initialRanking.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 데이터가 없습니다. TOP 게시물에 분야를 입력하면 집계됩니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-text-muted">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">분야</th>
                  <th className="py-2 pr-4">총 조회/노출</th>
                  <th className="py-2 pr-4">등장 횟수</th>
                </tr>
              </thead>
              <tbody>
                {initialRanking.map((r, i) => (
                  <tr key={r.area} className="border-b border-line/60">
                    <td className="py-2 pr-4 font-semibold text-text-muted">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-text-strong">{r.area}</td>
                    <td className="py-2 pr-4">{fmt(r.totalViews)}</td>
                    <td className="py-2 pr-4 text-text-muted">{r.appearances}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== 주간 기록 ===== */}
      <div>
        <h3 className="text-sm font-bold text-text-strong">주간 기록 ({initialWeeks.length})</h3>
        {initialWeeks.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 기록이 없습니다. 위에서 첫 주를 입력해 보세요.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {initialWeeks.map((w) => (
              <div key={w.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-text-strong">
                    {w.weekStart}
                    {w.weekEnd ? ` ~ ${w.weekEnd}` : ""}
                    {w.weekStart === latestWeek && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">최신</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => loadWeek(w)} className="text-xs font-medium text-primary hover:underline">
                      불러오기(수정)
                    </button>
                    <button type="button" onClick={() => remove(w.id)} className="text-xs font-medium text-rose-600 hover:underline">
                      삭제
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <span className="text-text-muted">
                    블로그 조회 <b className="text-text-strong">{fmt(w.naverViews)}</b>
                    <DeltaBadge value={w.deltas.naverViews} />
                  </span>
                  <span className="text-text-muted">
                    AI 인용 <b className="text-text-strong">{fmt(w.naverAiCitations)}</b>
                    <DeltaBadge value={w.deltas.naverAiCitations} />
                  </span>
                  <span className="text-text-muted">
                    LI 노출 <b className="text-text-strong">{fmt(w.liImpressions)}</b>
                    <DeltaBadge value={w.deltas.liImpressions} />
                  </span>
                  <span className="text-text-muted">
                    LI 팔로워 <b className="text-text-strong">{fmt(w.liFollowers)}</b>
                    <DeltaBadge value={w.deltas.liFollowers} />
                  </span>
                </div>
                {w.insight && <p className="mt-2 text-xs text-text-muted">💡 {w.insight}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TopEditor({
  title,
  rows,
  onChange,
  viewsLabel
}: {
  title: string;
  rows: TopRow[];
  onChange: (rows: TopRow[]) => void;
  viewsLabel: string;
}) {
  const inputCls = "w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm focus:border-gold focus:outline-none";
  return (
    <div className="mt-3">
      <label className="block text-xs font-medium text-text-muted mb-1">{title} (제목 / 분야 / {viewsLabel})</label>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_120px_90px] items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">{r.rank}</span>
            <input
              placeholder="제목/소재"
              className={inputCls}
              value={r.title}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], title: e.target.value };
                onChange(next);
              }}
            />
            <input
              placeholder="분야"
              list="area-suggestions"
              className={inputCls}
              value={r.area}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], area: e.target.value };
                onChange(next);
              }}
            />
            <input
              placeholder={viewsLabel}
              inputMode="numeric"
              className={inputCls}
              value={r.views}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], views: e.target.value };
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
