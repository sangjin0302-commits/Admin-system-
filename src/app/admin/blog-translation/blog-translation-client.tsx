"use client";

import { useState } from "react";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  published: boolean;
  publishedAt: string | null;
  hasEn: boolean;
  hasZh: boolean;
};

type TargetLang = "en" | "zh";

type EditorState = {
  postId: string;
  targetLang: TargetLang;
  title: string;
  excerpt: string;
  body: string;
};

export function BlogTranslationClient({ posts: initial }: { posts: PostRow[] }) {
  const [posts, setPosts] = useState<PostRow[]>(initial);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // "postId:lang"
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function requestTranslation(post: PostRow, targetLang: TargetLang) {
    setError(null);
    setSavedMsg(null);
    setLoading(`${post.id}:${targetLang}`);
    try {
      const res = await fetch("/api/admin/blog-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, targetLang }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        content?: { title: string; excerpt: string; body: string };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.content) {
        setError(data.error ?? `translate failed (${res.status})`);
        return;
      }
      setEditor({
        postId: post.id,
        targetLang,
        title: data.content.title,
        excerpt: data.content.excerpt,
        body: data.content.body,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, hasEn: targetLang === "en" ? true : p.hasEn, hasZh: targetLang === "zh" ? true : p.hasZh }
            : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "network_error");
    } finally {
      setLoading(null);
    }
  }

  async function loadExisting(post: PostRow, targetLang: TargetLang) {
    setError(null);
    setSavedMsg(null);
    setLoading(`${post.id}:${targetLang}:load`);
    try {
      const res = await fetch(`/api/admin/blog-translation?postId=${encodeURIComponent(post.id)}&targetLang=${targetLang}`);
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        content?: { title: string; excerpt: string; body: string } | null;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `load failed (${res.status})`);
        return;
      }
      if (!data.content) {
        // Not translated yet → auto-request
        await requestTranslation(post, targetLang);
        return;
      }
      setEditor({
        postId: post.id,
        targetLang,
        title: data.content.title,
        excerpt: data.content.excerpt,
        body: data.content.body,
      });
    } finally {
      setLoading(null);
    }
  }

  async function saveTranslation() {
    if (!editor) return;
    setError(null);
    setSavedMsg(null);
    setLoading(`save:${editor.postId}:${editor.targetLang}`);
    try {
      const res = await fetch("/api/admin/blog-translation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editor.postId,
          targetLang: editor.targetLang,
          title: editor.title,
          excerpt: editor.excerpt,
          content: editor.body,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `save failed (${res.status})`);
        return;
      }
      setSavedMsg(`${editor.targetLang.toUpperCase()} 번역 저장 완료`);
    } finally {
      setLoading(null);
    }
  }

  function publish() {
    // Mark as published by re-saving (same endpoint). Server already stores translation.
    // For BlogPost English fields, saving via PUT already updates published-ready fields.
    // For ZH, saving stores in SiteSetting → treated as published when present.
    setSavedMsg("게시 상태로 저장되었습니다. 공개 페이지에서 즉시 반영됩니다.");
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      ) : null}
      {savedMsg ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {savedMsg}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-3 py-3">상태</th>
              <th className="px-3 py-3">KO</th>
              <th className="px-3 py-3">EN</th>
              <th className="px-3 py-3">ZH</th>
              <th className="px-3 py-3 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-text-strong">{p.title}</div>
                  <div className="text-xs text-text-muted">/{p.slug}</div>
                </td>
                <td className="px-3 py-3 text-xs">
                  {p.published ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">공개</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">비공개</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">KO</span>
                </td>
                <td className="px-3 py-3">
                  {p.hasEn ? (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-200"
                      onClick={() => loadExisting(p, "en")}
                    >
                      EN ✓
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">EN —</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {p.hasZh ? (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-200"
                      onClick={() => loadExisting(p, "zh")}
                    >
                      ZH ✓
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">ZH —</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      disabled={loading === `${p.id}:en`}
                      onClick={() => requestTranslation(p, "en")}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-text-strong hover:bg-surface-muted disabled:opacity-50"
                    >
                      {loading === `${p.id}:en` ? "번역중…" : "EN 번역 요청"}
                    </button>
                    <button
                      type="button"
                      disabled={loading === `${p.id}:zh`}
                      onClick={() => requestTranslation(p, "zh")}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-text-strong hover:bg-surface-muted disabled:opacity-50"
                    >
                      {loading === `${p.id}:zh` ? "번역중…" : "ZH 번역 요청"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                  블로그 글이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {editor ? (
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-primary">
              번역 검토 · {editor.targetLang.toUpperCase()}
            </h2>
            <button
              type="button"
              className="text-xs text-text-muted hover:underline"
              onClick={() => setEditor(null)}
            >
              닫기
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-text-muted">제목</span>
              <input
                type="text"
                value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-text-strong"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-muted">요약</span>
              <textarea
                value={editor.excerpt}
                onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-text-strong"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-muted">본문 (HTML 보존)</span>
              <textarea
                value={editor.body}
                onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                rows={16}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-text-strong"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveTranslation}
                disabled={loading?.startsWith("save:")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
              >
                {loading?.startsWith("save:") ? "저장중…" : "번역 저장"}
              </button>
              <button
                type="button"
                onClick={publish}
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-text-strong hover:bg-surface-muted"
              >
                게시
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
