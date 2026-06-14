"use client";

import { useState } from "react";

export function ClientMessageBox({ caseId }: { caseId: string }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [info, setInfo] = useState("");

  async function send() {
    if (!title.trim() || !message.trim()) {
      setStatus("error");
      setInfo("제목과 내용을 입력해 주세요.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`/api/admin/case-matters/${caseId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
        setInfo(
          data.portalDelivered
            ? "포털 알림센터로 전달되었습니다."
            : data.emailAttempted
            ? "이메일로 발송되었습니다 (포털 미가입 의뢰인)."
            : "전송되었습니다."
        );
        setTitle("");
        setMessage("");
      } else {
        setStatus("error");
        setInfo(data.error ?? "전송 실패");
      }
    } catch {
      setStatus("error");
      setInfo("네트워크 오류");
    }
  }

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 shadow-panel">
      <p className="ui-kicker">의뢰인 연락</p>
      <h3 className="mt-1 text-base font-semibold text-text-strong">메시지 보내기</h3>
      <p className="mt-1 text-xs text-text-muted">의뢰인 포털 알림센터 + 이메일로 전달됩니다.</p>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setStatus("idle");
          }}
          placeholder="제목 (예: 자료 보완 요청)"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
        />
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setStatus("idle");
          }}
          rows={4}
          placeholder="의뢰인에게 전달할 내용을 입력하세요."
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={status === "sending"}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "sending" ? "전송 중…" : "전송"}
        </button>
        {status === "sent" && <span className="text-sm font-semibold text-emerald-600">✓ {info}</span>}
        {status === "error" && <span className="text-sm font-semibold text-rose-600">{info}</span>}
      </div>
    </div>
  );
}
