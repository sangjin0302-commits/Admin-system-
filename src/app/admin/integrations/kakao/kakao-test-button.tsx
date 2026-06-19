"use client";

import { useState } from "react";

export function KakaoTestButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleTest() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/kakao/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
        setMessage("테스트 알림톡 전송 성공");
      } else {
        setStatus("error");
        setMessage(data.error ?? "전송 실패");
      }
    } catch {
      setStatus("error");
      setMessage("네트워크 오류");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleTest}
        disabled={status === "loading"}
        className="rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-semibold text-[#3C1E1E] transition hover:brightness-95 disabled:opacity-50"
      >
        {status === "loading" ? "전송 중…" : "테스트 알림톡 전송"}
      </button>
      {message && (
        <span
          className={`text-sm ${
            status === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
