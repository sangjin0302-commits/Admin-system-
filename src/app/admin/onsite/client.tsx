"use client";

import { useMemo, useState } from "react";
import type { OnsiteMeeting } from "@/lib/services/onsite-meeting-service";

interface Props {
  initial: OnsiteMeeting[];
}

// 서울 시청 기본 좌표
const DEFAULT_START = { lat: 37.5665, lng: 126.978 };

export function OnsiteAdminClient({ initial }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [meetings, setMeetings] = useState<OnsiteMeeting[]>(initial);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OnsiteMeeting[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ totalKm: number; estTravelMinutes: number } | null>(null);
  const [start, setStart] = useState(DEFAULT_START);
  const [form, setForm] = useState({
    clientName: "", address: "", latitude: "37.5665", longitude: "126.978",
    scheduledAt: `${today}T10:00`, durationMin: "60", notes: "", caseId: "",
  });

  const daily = useMemo(
    () => meetings
      .filter((m) => m.scheduledAt.slice(0, 10) === date)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [meetings, date]
  );

  async function refresh() {
    const res = await fetch("/api/admin/onsite");
    const j = await res.json();
    if (j.ok) setMeetings(j.meetings);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/admin/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          data: {
            clientName: form.clientName,
            address: form.address,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            scheduledAt: new Date(form.scheduledAt).toISOString(),
            durationMin: Number(form.durationMin),
            notes: form.notes || undefined,
            caseId: form.caseId || undefined,
          },
        }),
      });
      setForm({ ...form, clientName: "", address: "", notes: "", caseId: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function optimize() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "optimize", date, startLat: start.lat, startLng: start.lng }),
      });
      const j = await res.json();
      if (j.ok) {
        setOrder(j.order);
        setRouteInfo({ totalKm: j.totalKm, estTravelMinutes: j.estTravelMinutes });
      }
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id: string, status: OnsiteMeeting["status"]) {
    setBusy(true);
    try {
      await fetch("/api/admin/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", id, status }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const display = order ?? daily;

  // Build simple SVG plot of points
  const bounds = useMemo(() => {
    if (display.length === 0) return null;
    const lats = display.map((m) => m.latitude);
    const lngs = display.map((m) => m.longitude);
    return {
      minLat: Math.min(...lats, start.lat),
      maxLat: Math.max(...lats, start.lat),
      minLng: Math.min(...lngs, start.lng),
      maxLng: Math.max(...lngs, start.lng),
    };
  }, [display, start]);

  function project(lat: number, lng: number) {
    if (!bounds) return { x: 0, y: 0 };
    const dx = (bounds.maxLng - bounds.minLng) || 0.01;
    const dy = (bounds.maxLat - bounds.minLat) || 0.01;
    return {
      x: 40 + ((lng - bounds.minLng) / dx) * 320,
      y: 260 - ((lat - bounds.minLat) / dy) * 220,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setOrder(null); setRouteInfo(null); }}
          className="h-10 rounded-lg border border-line px-3 text-sm" />
        <label className="text-xs text-text-muted">출발 위도
          <input type="number" step="0.0001" value={start.lat}
            onChange={(e) => setStart({ ...start, lat: Number(e.target.value) })}
            className="ml-1 h-8 w-24 rounded border border-line px-2 text-xs" />
        </label>
        <label className="text-xs text-text-muted">경도
          <input type="number" step="0.0001" value={start.lng}
            onChange={(e) => setStart({ ...start, lng: Number(e.target.value) })}
            className="ml-1 h-8 w-24 rounded border border-line px-2 text-xs" />
        </label>
        <button type="button" onClick={optimize} disabled={busy || daily.length === 0}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-50">
          동선 최적화
        </button>
        {routeInfo && (
          <span className="text-xs text-text-muted">
            총 {routeInfo.totalKm}km · 이동 약 {routeInfo.estTravelMinutes}분
          </span>
        )}
      </div>

      <form onSubmit={submitAdd} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-4 md:grid-cols-2">
        <input required placeholder="고객명" value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input required placeholder="주소" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input required type="number" step="0.0001" placeholder="위도" value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input required type="number" step="0.0001" placeholder="경도" value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input required type="datetime-local" value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input required type="number" placeholder="소요(분)" value={form.durationMin}
          onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input placeholder="사건 ID (선택)" value={form.caseId}
          onChange={(e) => setForm({ ...form, caseId: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <input placeholder="메모" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="h-10 rounded border border-line px-3 text-sm" />
        <button type="submit" disabled={busy}
          className="rounded bg-primary px-4 py-2 text-sm font-bold text-white md:col-span-2">
          방문 등록
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-bold">{date} 일정 ({display.length})</h3>
          <ol className="mt-2 space-y-2">
            {display.map((m, idx) => (
              <li key={m.id} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {order && <span className="mr-2 rounded bg-primary text-white px-1.5 text-xs">{idx + 1}</span>}
                      {new Date(m.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{m.clientName}
                    </p>
                    <p className="text-xs text-text-muted">{m.address}</p>
                    {m.notes && <p className="mt-1 text-xs">{m.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <span className="rounded bg-surface-muted px-2 py-0.5">{m.status}</span>
                    <div className="flex gap-1">
                      {m.status === "scheduled" && (
                        <button type="button" onClick={() => updateStatus(m.id, "en_route")}
                          className="rounded border border-line px-2 py-0.5">이동중</button>
                      )}
                      {m.status !== "completed" && m.status !== "cancelled" && (
                        <button type="button" onClick={() => updateStatus(m.id, "completed")}
                          className="rounded bg-primary px-2 py-0.5 text-white">완료</button>
                      )}
                      <button type="button" onClick={() => del(m.id)}
                        className="rounded text-red-600">삭제</button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {display.length === 0 && <li className="py-6 text-center text-sm text-text-muted">일정 없음.</li>}
          </ol>
        </div>

        <div>
          <h3 className="text-base font-bold">지도</h3>
          <svg viewBox="0 0 400 300" className="mt-2 h-72 w-full rounded-lg border border-line bg-surface-muted">
            {bounds && (
              <>
                <circle cx={project(start.lat, start.lng).x} cy={project(start.lat, start.lng).y}
                  r={6} fill="#0aa" />
                <text x={project(start.lat, start.lng).x + 8}
                  y={project(start.lat, start.lng).y + 4} fontSize="10" fill="#0aa">출발</text>
                {display.map((m, i) => {
                  const { x, y } = project(m.latitude, m.longitude);
                  return (
                    <g key={m.id}>
                      <circle cx={x} cy={y} r={7} fill="#c47" />
                      <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">{i + 1}</text>
                    </g>
                  );
                })}
                {order && order.length > 0 && (
                  <polyline
                    points={[
                      `${project(start.lat, start.lng).x},${project(start.lat, start.lng).y}`,
                      ...order.map((m) => {
                        const p = project(m.latitude, m.longitude);
                        return `${p.x},${p.y}`;
                      }),
                    ].join(" ")}
                    fill="none" stroke="#0aa" strokeDasharray="4 3" strokeWidth={1.5}
                  />
                )}
              </>
            )}
            {!bounds && (
              <text x="200" y="150" textAnchor="middle" fontSize="12" fill="#888">지도 표시할 방문이 없습니다.</text>
            )}
          </svg>
          {display.length > 0 && (
            <a href={`https://map.kakao.com/link/map/onsite,${display[0].latitude},${display[0].longitude}`}
              target="_blank" rel="noreferrer"
              className="mt-2 inline-block text-xs text-primary underline">
              카카오맵에서 열기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
