"use client";

import { useState } from "react";

type ClosedCase = {
  id: string;
  title: string;
  category: string;
  closedAt: string | null;
  summary: string;
};

type Story = {
  title: string;
  problem: string;
  solution: string;
  outcome: string;
  category: string;
  keyLearnings: string[];
};

export function CaseStoryGenerator({ closedCases }: { closedCases: ClosedCase[] }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [story, setStory] = useState<Story | null>(null);
  const [busy, setBusy] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function generate(id: string) {
    setBusy(true);
    setMsg("");
    setSelectedId(id);
    try {
      const res = await fetch("/api/admin/case-stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseMatterId: id }),
      });
      const data = await res.json();
      if (res.ok && data.story) {
        setStory(data.story);
      } else {
        setMsg(data.error ?? "생성 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!story) return;
    setPubBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/case-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: story.category,
          title: story.title,
          summary: `${story.problem}\n\n${story.solution}`,
          outcome: story.outcome,
          duration: "사안별",
          published: true,
          sortOrder: 0,
        }),
      });
      if (res.ok) {
        setMsg("게시 완료 — 처리 사례 페이지에 노출됩니다.");
        setStory(null);
        setSelectedId("");
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "게시 실패");
      }
    } finally {
      setPubBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-lg border border-line bg-white/60 p-4">
        <h3 className="text-sm font-semibold text-text-strong">종결 사건 ({closedCases.length}건)</h3>
        {closedCases.length === 0 ? (
          <p className="mt-3 text-xs text-text-muted">종결된 사건이 없습니다.</p>
        ) : (
          <ul className="mt-3 max-h-[500px] space-y-2 overflow-auto pr-1">
            {closedCases.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => generate(c.id)}
                  disabled={busy}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                    selectedId === c.id
                      ? "border-gold bg-gold-soft/30"
                      : "border-line hover:border-gold/50"
                  } disabled:opacity-50`}
                >
                  <div className="font-semibold text-text-strong">{c.title}</div>
                  <div className="mt-1 flex gap-2 text-[10px] text-text-muted">
                    <span>{c.category}</span>
                    {c.closedAt && <span>{c.closedAt.slice(0, 10)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-line bg-white/60 p-4">
        <h3 className="text-sm font-semibold text-text-strong">생성된 스토리</h3>
        {busy && <p className="mt-3 text-xs text-text-muted">AI 생성 중…</p>}
        {msg && <p className="mt-3 text-xs text-primary">{msg}</p>}
        {!busy && !story && !msg && (
          <p className="mt-3 text-xs text-text-muted">좌측에서 사건을 선택하세요.</p>
        )}
        {story && (
          <div className="mt-4 space-y-3">
            <Field label="분야">
              <select
                value={story.category}
                onChange={(e) => setStory({ ...story, category: e.target.value })}
                className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              >
                <option value="VISA_STAY">비자/체류</option>
                <option value="ADMIN_APPEAL">행정심판</option>
                <option value="CONTRACT_INVESTIGATION">계약·사실조사</option>
                <option value="LICENSE_PERMIT">인허가</option>
                <option value="CORP_FORMATION">법인설립</option>
              </select>
            </Field>
            <Field label="제목">
              <input
                value={story.title}
                onChange={(e) => setStory({ ...story, title: e.target.value })}
                className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              />
            </Field>
            <Field label="문제 (2줄)">
              <textarea
                rows={3}
                value={story.problem}
                onChange={(e) => setStory({ ...story, problem: e.target.value })}
                className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
              />
            </Field>
            <Field label="해결 (2줄)">
              <textarea
                rows={3}
                value={story.solution}
                onChange={(e) => setStory({ ...story, solution: e.target.value })}
                className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
              />
            </Field>
            <Field label="결과 (1줄)">
              <input
                value={story.outcome}
                onChange={(e) => setStory({ ...story, outcome: e.target.value })}
                className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              />
            </Field>
            <Field label="Key Learnings (3개, 줄바꿈)">
              <textarea
                rows={4}
                value={story.keyLearnings.join("\n")}
                onChange={(e) =>
                  setStory({
                    ...story,
                    keyLearnings: e.target.value.split("\n").filter((s) => s.trim()),
                  })
                }
                className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
              />
            </Field>
            <button
              type="button"
              onClick={publish}
              disabled={pubBusy}
              className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pubBusy ? "게시 중…" : "처리 사례로 게시"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
