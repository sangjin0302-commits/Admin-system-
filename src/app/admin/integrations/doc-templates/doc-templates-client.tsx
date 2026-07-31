"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Template {
  slug: string;
  name: string;
  templateDocId: string;
  variables: string[];
  createdAt: string;
}

interface StandardVar {
  key: string;
  desc: string;
}

const API = "/api/admin/doc-templates";

export function DocTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [standardVars, setStandardVars] = useState<StandardVar[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(API);
      const j = (await res.json()) as { ok?: boolean; templates?: Template[]; standardVariables?: StandardVar[] };
      if (j.ok) {
        setTemplates(j.templates ?? []);
        setStandardVars(j.standardVariables ?? []);
      }
    } catch {
      setMsg("목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTemplate() {
    if (!name.trim()) {
      setMsg("서식 이름을 입력하세요.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: name.trim() })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; editUrl?: string; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "서식 생성 실패 — 구글 연결을 확인하세요.");
        return;
      }
      setName("");
      setMsg("빈 서식 문서를 만들었습니다. 새 탭에서 서식을 작성한 뒤 '변수 재스캔'을 누르세요.");
      if (j.editUrl) window.open(j.editUrl, "_blank", "noopener");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function rescan(slug: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rescan", slug })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "변수 재스캔 실패");
        return;
      }
      setMsg("변수를 다시 읽었습니다.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(slug: string) {
    if (!confirm("이 서식 등록을 삭제할까요? (구글 문서 자체는 남습니다)")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "삭제 실패");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">사용 방법</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-muted">
          <li>아래에서 서식 이름을 정하고 <b>새 서식 만들기</b> → 빈 구글 문서가 열립니다.</li>
          <li>구글 문서에서 서식(위임장·계약서 등)을 자유롭게 디자인합니다. 표·서명란·글자서식 모두 가능.</li>
          <li>값이 자동으로 채워질 자리에 <code className="rounded bg-surface-muted px-1">{"{{변수}}"}</code> 를 넣습니다. 예: <code className="rounded bg-surface-muted px-1">{"{{의뢰인}}"}</code></li>
          <li>돌아와서 <b>변수 재스캔</b> → 문서 속 변수를 인식합니다.</li>
          <li>사건 상세 → <b>구글 ▾</b> 에서 이 서식을 고르면 사건 데이터가 채워진 문서/PDF가 생성됩니다.</li>
        </ol>

        <div className="mt-4">
          <p className="text-xs font-semibold text-text-strong">사용 가능한 표준 변수</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {standardVars.map((v) => (
              <span
                key={v.key}
                title={v.desc}
                className="ui-status-pill bg-surface-muted text-text-muted"
              >
                {`{{${v.key}}}`}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">새 서식 만들기</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="서식 이름 (예: 행정심판 청구서)"
            className="h-10 flex-1 rounded-lg border border-line bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            disabled={busy}
            onClick={createTemplate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            새 서식 만들기
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-warning">{msg}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">등록된 서식 ({templates.length})</h3>
        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 등록된 서식이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {templates.map((t) => (
              <li key={t.slug} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-strong">{t.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      변수 {t.variables.length}개
                      {t.variables.length > 0 ? `: ${t.variables.map((v) => `{{${v}}}`).join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://docs.google.com/document/d/${t.templateDocId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-muted"
                    >
                      문서 편집
                    </a>
                    <button
                      disabled={busy}
                      onClick={() => rescan(t.slug)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      변수 재스캔
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => remove(t.slug)}
                      className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
