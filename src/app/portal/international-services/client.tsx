"use client";

import { useCallback, useEffect, useState } from "react";

type Tab = "shipping" | "notary" | "history";

interface Payload {
  ok: boolean;
  shipping: Array<{ id: string; documents: string[]; costKrw: number; status: string; createdAt: string; service: string }>;
  notary: Array<{ id: string; documentTitle: string; costKrw: number; status: string; createdAt: string; urgency: string }>;
}

export function InternationalClient() {
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<Tab>("shipping");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (uid: string) => {
    const res = await fetch(`/api/portal/international-services?userId=${encodeURIComponent(uid)}`);
    const json = (await res.json()) as Payload;
    if (json.ok) setData(json);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("portal.email");
      if (cached) { setEmail(cached); load(cached); }
    }
  }, [load]);

  // Shipping form state
  const [ship, setShip] = useState({
    documents: "",
    service: "standard" as "standard" | "express",
    name: "", line1: "", city: "", postalCode: "", country: "US", phone: "",
  });

  // Notary form state
  const [not, setNot] = useState({
    documentTitle: "",
    documentType: "power_of_attorney" as "power_of_attorney" | "affidavit" | "translation_certification" | "corporate_document" | "personal_document" | "other",
    urgency: "standard" as "standard" | "next_day" | "same_day",
    delivery: "pickup" as "pickup" | "domestic_mail" | "international",
    destinationAddress: "",
  });

  async function submitShipping() {
    if (!email) { setMsg("이메일 필요"); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/portal/international-services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: email, kind: "shipping",
          shipping: {
            documents: ship.documents.split("\n").filter(Boolean),
            service: ship.service,
            destination: {
              name: ship.name, line1: ship.line1, city: ship.city,
              postalCode: ship.postalCode, country: ship.country, phone: ship.phone,
            },
          },
        }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) { setMsg("배송 요청 접수 완료"); await load(email); setTab("history"); }
    } finally { setBusy(false); }
  }

  async function submitNotary() {
    if (!email) { setMsg("이메일 필요"); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/portal/international-services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email, kind: "notary", notary: not }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) { setMsg("공증 요청 접수 완료"); await load(email); setTab("history"); }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-line px-3 py-2 text-sm" />
        <button type="button" onClick={() => { if (typeof window !== "undefined") window.localStorage.setItem("portal.email", email); load(email); }} disabled={!email} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">조회</button>
      </div>

      <nav className="flex gap-2 border-b border-line">
        {(["shipping", "notary", "history"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-bold text-primary" : "text-text-muted"}`}>
            {t === "shipping" ? "국제 배송 요청" : t === "notary" ? "공증 요청" : "이력"}
          </button>
        ))}
      </nav>

      {msg && <p className="text-sm text-primary">{msg}</p>}

      {tab === "shipping" && (
        <div className="space-y-3 rounded-xl border border-line bg-surface p-6">
          <textarea placeholder="문서 목록 (한 줄에 하나)" value={ship.documents} onChange={(e) => setShip({ ...ship, documents: e.target.value })} className="w-full rounded border border-line px-3 py-2 text-sm" rows={3} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="수취인" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
            <input placeholder="전화" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
            <input placeholder="주소" value={ship.line1} onChange={(e) => setShip({ ...ship, line1: e.target.value })} className="rounded border border-line px-3 py-2 text-sm sm:col-span-2" />
            <input placeholder="도시" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
            <input placeholder="우편번호" value={ship.postalCode} onChange={(e) => setShip({ ...ship, postalCode: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
            <input placeholder="국가 (ISO2, US/JP/...)" value={ship.country} onChange={(e) => setShip({ ...ship, country: e.target.value.toUpperCase() })} className="rounded border border-line px-3 py-2 text-sm" />
            <select value={ship.service} onChange={(e) => setShip({ ...ship, service: e.target.value as "standard" | "express" })} className="rounded border border-line px-3 py-2 text-sm">
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </div>
          <button type="button" onClick={submitShipping} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">배송 요청</button>
        </div>
      )}

      {tab === "notary" && (
        <div className="space-y-3 rounded-xl border border-line bg-surface p-6">
          <input placeholder="문서명" value={not.documentTitle} onChange={(e) => setNot({ ...not, documentTitle: e.target.value })} className="w-full rounded border border-line px-3 py-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={not.documentType} onChange={(e) => setNot({ ...not, documentType: e.target.value as typeof not.documentType })} className="rounded border border-line px-3 py-2 text-sm">
              <option value="power_of_attorney">위임장</option>
              <option value="affidavit">진술서</option>
              <option value="translation_certification">번역 공증</option>
              <option value="corporate_document">법인 문서</option>
              <option value="personal_document">개인 문서</option>
              <option value="other">기타</option>
            </select>
            <select value={not.urgency} onChange={(e) => setNot({ ...not, urgency: e.target.value as typeof not.urgency })} className="rounded border border-line px-3 py-2 text-sm">
              <option value="standard">표준</option>
              <option value="next_day">익일</option>
              <option value="same_day">당일</option>
            </select>
            <select value={not.delivery} onChange={(e) => setNot({ ...not, delivery: e.target.value as typeof not.delivery })} className="rounded border border-line px-3 py-2 text-sm">
              <option value="pickup">방문 수령</option>
              <option value="domestic_mail">국내 우편</option>
              <option value="international">국제 배송</option>
            </select>
            <input placeholder="배송 주소 (해당 시)" value={not.destinationAddress} onChange={(e) => setNot({ ...not, destinationAddress: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={submitNotary} disabled={busy || !not.documentTitle} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">공증 요청</button>
        </div>
      )}

      {tab === "history" && data && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-primary">배송 이력</h3>
            {data.shipping.length === 0 ? <p className="text-sm text-text-muted">없음</p> : (
              <ul className="mt-2 space-y-2">
                {data.shipping.map((s) => (
                  <li key={s.id} className="rounded border border-line p-3 text-sm">
                    <div className="flex justify-between"><span>{s.documents.join(", ")}</span><span>{s.status}</span></div>
                    <div className="text-xs text-text-muted">{s.service} · ₩{s.costKrw.toLocaleString()} · {new Date(s.createdAt).toLocaleDateString("ko-KR")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-bold text-primary">공증 이력</h3>
            {data.notary.length === 0 ? <p className="text-sm text-text-muted">없음</p> : (
              <ul className="mt-2 space-y-2">
                {data.notary.map((n) => (
                  <li key={n.id} className="rounded border border-line p-3 text-sm">
                    <div className="flex justify-between"><span>{n.documentTitle}</span><span>{n.status}</span></div>
                    <div className="text-xs text-text-muted">{n.urgency} · ₩{n.costKrw.toLocaleString()} · {new Date(n.createdAt).toLocaleDateString("ko-KR")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
