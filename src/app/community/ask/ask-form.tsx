"use client";

import { useState } from "react";

export function CommunityAskForm({ categories }: { categories: string[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "기타");
  const [askerName, setAskerName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    if (!agreed) {
      setStatus("error");
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/public/community/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, askerName: askerName || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "제출에 실패했습니다.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setTitle("");
      setBody("");
      setAskerName("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-semibold">질문이 접수되었습니다.</p>
        <p className="mt-1">검토 후 공개 아카이브에서 답변드립니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-strong">분야</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-strong">질문 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="예: D-8 비자 연장 시 재직증명서 유효기간이 어떻게 되나요?"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-strong">상세 내용</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={5000}
          rows={7}
          placeholder="상황, 시도한 것, 궁금한 점을 구체적으로 적어주세요. 개인정보(주민번호, 여권번호 등)는 포함하지 마세요."
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-strong">
          닉네임 (선택)
        </label>
        <input
          type="text"
          value={askerName}
          onChange={(e) => setAskerName(e.target.value)}
          maxLength={40}
          placeholder="비워두면 익명 처리됩니다"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-2 text-xs leading-5 text-text-muted">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
        />
        <span>
          [필수] 질문 내용·표시명의 공개 게시 및 개인정보 수집·이용에 동의합니다.{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">개인정보처리방침</a>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "submitting" ? "제출 중…" : "질문 제출"}
      </button>
    </form>
  );
}
