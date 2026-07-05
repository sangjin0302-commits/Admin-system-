"use client";

import { useState } from "react";

export function NetworkApplyClient() {
  const [form, setForm] = useState({
    name: "", firm: "", specialties: "", contactEmail: "", phone: "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/network/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (j.ok) {
        setMsg("신청이 접수되었습니다. 검토 후 연락드립니다.");
        setForm({ name: "", firm: "", specialties: "", contactEmail: "", phone: "", notes: "" });
      } else {
        setMsg("신청 실패: " + (j.error ?? "unknown"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line p-5">
      <h3 className="text-lg font-bold">파트너 신청</h3>
      <input required placeholder="성함" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="h-10 w-full rounded border border-line px-3 text-sm" />
      <input required placeholder="사무소명" value={form.firm}
        onChange={(e) => setForm({ ...form, firm: e.target.value })}
        className="h-10 w-full rounded border border-line px-3 text-sm" />
      <input placeholder="전문분야 (콤마 구분: 출입국, 영업허가...)" value={form.specialties}
        onChange={(e) => setForm({ ...form, specialties: e.target.value })}
        className="h-10 w-full rounded border border-line px-3 text-sm" />
      <input required type="email" placeholder="연락 이메일" value={form.contactEmail}
        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
        className="h-10 w-full rounded border border-line px-3 text-sm" />
      <input placeholder="휴대전화 (선택)" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="h-10 w-full rounded border border-line px-3 text-sm" />
      <textarea placeholder="자유 소개" value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        className="min-h-[80px] w-full rounded border border-line p-3 text-sm" />
      <button type="submit" disabled={busy}
        className="w-full rounded bg-primary px-4 py-2.5 text-sm font-bold text-white">
        신청하기
      </button>
      {msg && <p className="text-center text-xs text-text-muted">{msg}</p>}
    </form>
  );
}
