"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";

type Section = {
  key: string;
  icon: string;
  label: string;
  items: string[];
  checklist?: boolean;
};

function toStringArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.map((s) => String(s)).filter((s) => s.trim().length > 0);
}

export function LawbotPlaybookCard({
  inquiryId,
  snapshot
}: {
  inquiryId: string;
  snapshot: Partial<LawbotResponse>;
}) {
  const sections = useMemo<Section[]>(() => {
    const raw: Section[] = [
      {
        key: "playbook",
        icon: "📘",
        label: "절차 가이드",
        items: toStringArray(snapshot.practice_playbook)
      },
      {
        key: "docs",
        icon: "📋",
        label: "필요 서류",
        items: toStringArray(snapshot.document_checklist),
        checklist: true
      },
      {
        key: "risks",
        icon: "⚠️",
        label: "실무 주의사항",
        items: [
          ...toStringArray(snapshot.common_failure_points),
          ...toStringArray(snapshot.risk_flags)
        ]
      },
      {
        key: "actions",
        icon: "🎯",
        label: "다음 액션",
        items: toStringArray(snapshot.priority_actions)
      },
      {
        key: "authority",
        icon: "🏛",
        label: "담당 기관",
        items: toStringArray(snapshot.authority_path)
      },
      {
        key: "checkpoints",
        icon: "✅",
        label: "초기 체크포인트",
        items: toStringArray(snapshot.initial_checkpoints),
        checklist: true
      },
      {
        key: "study",
        icon: "📚",
        label: "학습 가이드",
        items: toStringArray(snapshot.study_guide)
      }
    ];
    return raw.filter((s) => s.items.length > 0);
  }, [snapshot]);

  const [activeKey, setActiveKey] = useState<string | null>(
    sections[0]?.key ?? null
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const active = sections.find((s) => s.key === activeKey) ?? sections[0];

  if (sections.length === 0) {
    return null;
  }

  return (
    <Card className="p-5" id={`lawbot-playbook-${inquiryId}`}>
      <div className="mb-4">
        <p className="ui-kicker">R4-5 · Lawbot 사건 유형 Playbook</p>
        <h3 className="text-sm font-semibold text-text-strong">
          실무 플레이북
        </h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {sections.map((s) => {
          const isActive = s.key === active?.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-line bg-white text-text-muted hover:border-brand-navy/50"
              }`}
            >
              <span className="mr-1">{s.icon}</span>
              {s.label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {s.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div>
          {active.checklist ? (
            <ul className="space-y-2">
              {active.items.map((item, idx) => {
                const cid = `${active.key}-${idx}`;
                const isChecked = !!checked[cid];
                return (
                  <li key={cid} className="flex items-start gap-2">
                    <input
                      id={cid}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setChecked((c) => ({ ...c, [cid]: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 accent-brand-navy"
                    />
                    <label
                      htmlFor={cid}
                      className={`text-sm ${isChecked ? "text-text-muted line-through" : "text-text-strong"}`}
                    >
                      {item}
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ol className="space-y-2">
              {active.items.map((item, idx) => (
                <li
                  key={`${active.key}-${idx}`}
                  className="flex items-start gap-3 text-sm text-text-strong"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-navy/10 text-[11px] font-semibold text-brand-navy">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Card>
  );
}
