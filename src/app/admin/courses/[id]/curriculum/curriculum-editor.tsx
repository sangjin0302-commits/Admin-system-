"use client";

import { useState } from "react";
import type { Curriculum, Module } from "@/lib/services/certification-course-service";

export function CurriculumEditor({ courseId, initial }: { courseId: string; initial: Curriculum }) {
  const [modules, setModules] = useState<Module[]>(initial.modules);
  const [required, setRequired] = useState<boolean>(initial.requiredForCertificate);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function addModule() {
    setModules([...modules, { id: `m_${Date.now().toString(36)}`, title: "새 모듈", videos: [""] }]);
  }
  function removeModule(idx: number) {
    setModules(modules.filter((_, i) => i !== idx));
  }
  function updateModule(idx: number, patch: Partial<Module>) {
    setModules(modules.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }
  async function save() {
    setBusy(true);
    setSaved(false);
    const res = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, modules, requiredForCertificate: required }),
    });
    setBusy(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        수료증 발급을 위해 모든 모듈 필수
      </label>

      <ul className="space-y-3">
        {modules.map((m, idx) => (
          <li key={m.id} className="rounded border border-line p-3">
            <div className="flex items-center gap-2">
              <input
                value={m.title}
                onChange={(e) => updateModule(idx, { title: e.target.value })}
                className="flex-1 rounded border border-line px-2 py-1"
              />
              <button onClick={() => removeModule(idx)} className="text-xs text-red-600">
                삭제
              </button>
            </div>
            <textarea
              placeholder="설명"
              value={m.description ?? ""}
              onChange={(e) => updateModule(idx, { description: e.target.value })}
              rows={2}
              className="mt-2 w-full rounded border border-line px-2 py-1 text-sm"
            />
            <input
              placeholder="비디오 URL"
              value={m.videos[0] ?? ""}
              onChange={(e) => updateModule(idx, { videos: [e.target.value] })}
              className="mt-2 w-full rounded border border-line px-2 py-1 text-sm"
            />
          </li>
        ))}
      </ul>

      <button onClick={addModule} className="rounded border border-primary px-3 py-1.5 text-xs font-bold text-primary">
        + 모듈 추가
      </button>

      <div className="pt-4">
        <button onClick={save} disabled={busy} className="rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">
          {busy ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="ml-3 text-sm text-primary">저장됨</span>}
      </div>
    </div>
  );
}
