"use client";

import { useState, useTransition } from "react";
import type { PageTier } from "@/lib/services/admin-page-tiers";

type Props = {
  initialHideMode: boolean;
  initialShowAdvanced: boolean;
  grouped: Record<PageTier, string[]>;
  tierLabels: Record<PageTier, string>;
  tiers: PageTier[];
};

async function setFlag(key: string, enabled: boolean) {
  const res = await fetch("/api/admin/features", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, enabled }),
  });
  if (!res.ok) throw new Error(`플래그 저장 실패: ${res.status}`);
}

export function HideModeClient({ initialHideMode, initialShowAdvanced, grouped, tierLabels, tiers }: Props) {
  const [hideMode, setHideMode] = useState(initialHideMode);
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const [msg, setMsg] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const toggleHideMode = (next: boolean) => {
    setHideMode(next);
    startTransition(async () => {
      try {
        await setFlag("admin_hide_mode", next);
        setMsg(next ? "감춤 모드 켜짐 — 새로고침 시 사이드바 필터 적용" : "감춤 모드 꺼짐 — 전체 표시");
      } catch (e) {
        setMsg((e as Error).message);
      }
    });
  };
  const toggleShowAdvanced = (next: boolean) => {
    setShowAdvanced(next);
    startTransition(async () => {
      try {
        await setFlag("admin_show_advanced", next);
        setMsg(next ? "고급 페이지 표시 켜짐" : "고급 페이지 표시 꺼짐");
      } catch (e) {
        setMsg((e as Error).message);
      }
    });
  };

  const preset = (mode: "essential" | "all") => {
    if (mode === "essential") {
      toggleHideMode(true);
      toggleShowAdvanced(false);
    } else {
      toggleHideMode(false);
      toggleShowAdvanced(true);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-5 shadow-panel space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => preset("essential")}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            필수만 보기 (권장)
          </button>
          <button
            type="button"
            onClick={() => preset("all")}
            disabled={pending}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-text-strong hover:bg-surface-muted disabled:opacity-50"
          >
            전부 보기
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-line">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={hideMode} onChange={(e) => toggleHideMode(e.target.checked)} disabled={pending} />
            <span><b>감춤 모드</b> — 사이드바를 tier로 필터링</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={showAdvanced} onChange={(e) => toggleShowAdvanced(e.target.checked)} disabled={pending || !hideMode} />
            <span><b>고급 페이지 표시</b> — advanced tier까지 노출</span>
          </label>
        </div>

        {msg && <p className="text-xs text-text-muted">{msg}</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-strong">Tier별 페이지 목록</h2>
        {tiers.map((tier) => {
          const visible =
            !hideMode ||
            tier === "core" ||
            (showAdvanced && (tier === "frequent" || tier === "occasional" || tier === "advanced"));
          return (
            <div key={tier} className="rounded-xl border border-line bg-surface p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-strong">
                  {tierLabels[tier]}
                  <span className="ml-2 text-xs text-text-muted">({grouped[tier].length})</span>
                </h3>
                <span className={visible ? "text-xs text-success" : "text-xs text-text-muted"}>
                  {visible ? "표시" : "숨김"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {grouped[tier].map((path) => (
                  <a
                    key={path}
                    href={`/admin/${path}`}
                    className="rounded-md border border-line bg-surface-muted px-2 py-1 text-xs text-text-muted hover:text-text-strong"
                  >
                    /admin/{path || "(dashboard)"}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
