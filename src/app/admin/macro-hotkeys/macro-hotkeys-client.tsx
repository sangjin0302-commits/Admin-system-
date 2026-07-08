"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Macro = { key: number; text: string; name?: string };
const LS_KEY = "admin.macros";

const DEFAULT_MACROS: Macro[] = [
  { key: 1, name: "인사", text: "안녕하세요, ETHOS 행정사사무소입니다." },
  { key: 2, name: "확인", text: "문의 확인했습니다. 곧 다시 안내드리겠습니다." },
  { key: 3, name: "서류", text: "다음 서류를 준비 부탁드립니다:\n- 신분증\n- 관련 처분서\n- 기타 증빙" },
  { key: 4, name: "감사", text: "감사합니다. 편안한 하루 되세요." },
  { key: 5, name: "", text: "" },
  { key: 6, name: "", text: "" },
  { key: 7, name: "", text: "" },
  { key: 8, name: "", text: "" },
  { key: 9, name: "", text: "" },
];

function loadMacros(): Macro[] {
  if (typeof window === "undefined") return DEFAULT_MACROS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_MACROS;
    const parsed = JSON.parse(raw) as Macro[];
    const merged: Macro[] = [];
    for (let k = 1; k <= 9; k++) {
      const existing = parsed.find((m) => m.key === k);
      merged.push(existing ?? { key: k, text: "", name: "" });
    }
    return merged;
  } catch { return DEFAULT_MACROS; }
}

export function MacroHotkeysClient() {
  const [macros, setMacros] = useState<Macro[]>(DEFAULT_MACROS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setMacros(loadMacros()); }, []);

  const save = () => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(macros));
      setDirty(false);
      toast.success("저장됨");
    } catch { toast.error("저장 실패"); }
  };

  const update = (key: number, patch: Partial<Macro>) => {
    setMacros((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
    setDirty(true);
  };

  return (
    <div className="space-y-3">
      {macros.map((m) => (
        <div key={m.key} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">Ctrl+{m.key}</span>
            <input
              type="text"
              value={m.name ?? ""}
              onChange={(e) => update(m.key, { name: e.target.value })}
              placeholder={`매크로 ${m.key} 이름`}
              className="flex-1 rounded border border-line bg-surface-muted px-2 py-1 text-xs"
              maxLength={30}
            />
          </div>
          <textarea
            value={m.text}
            onChange={(e) => update(m.key, { text: e.target.value })}
            placeholder={`Ctrl+${m.key}에 할당할 텍스트...`}
            className="mt-2 w-full min-h-[60px] rounded border border-line bg-surface-muted px-2 py-1 text-xs"
            maxLength={1500}
          />
        </div>
      ))}
      <button
        onClick={save}
        disabled={!dirty}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        저장 ({dirty ? "변경됨" : "변경 없음"})
      </button>
    </div>
  );
}
