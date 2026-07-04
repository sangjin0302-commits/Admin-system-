"use client";

import { useState } from "react";

interface DeadlineRow {
  id: string;
  caseNo: string | null;
  title: string;
  dueDate: string;
  daysLeft: number;
  synced: boolean;
  googleEventId: string | null;
}

interface Props {
  initialRows: DeadlineRow[];
  configured: boolean;
}

export default function DeadlinesClient({ initialRows, configured }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function syncOne(caseId: string) {
    setBusy(caseId);
    setStatus("");
    try {
      const res = await fetch("/api/admin/deadlines/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.provider === "google" && data.eventId) {
          setRows((rs) =>
            rs.map((r) => (r.id === caseId ? { ...r, synced: true, googleEventId: data.eventId } : r))
          );
          setStatus(`동기 완료 (event ${data.eventId})`);
        } else if (data.icsFallbackUrl) {
          window.open(data.icsFallbackUrl, "_blank");
          setStatus(`.ics 폴백 다운로드`);
        } else {
          setStatus(`결과: ${data.message ?? "unknown"}`);
        }
      } else {
        setStatus(`실패: ${data.error ?? res.status}`);
      }
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  async function syncAll() {
    setBusy("__bulk__");
    setStatus("");
    try {
      const res = await fetch("/api/admin/deadlines/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(`일괄 동기: ${data.count}건 처리`);
        // 성공한 항목만 상태 갱신
        const successIds = new Set(
          (data.results ?? [])
            .filter((r: { ok: boolean; caseId: string }) => r.ok)
            .map((r: { caseId: string }) => r.caseId)
        );
        setRows((rs) => rs.map((r) => (successIds.has(r.id) ? { ...r, synced: true } : r)));
      } else {
        setStatus(`실패: ${data.error}`);
      }
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>마감 관리 · Google Calendar 동기</h1>
      <p style={{ color: "#555", marginBottom: 12 }}>
        향후 60일 이내 사건 마감 목록. Google Calendar 서비스 계정{configured ? " (설정됨)" : " 미설정 → .ics 폴백 제공"}.
      </p>
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={syncAll} disabled={busy !== null} style={primaryBtn}>
          {busy === "__bulk__" ? "동기 중..." : "일괄 동기 (전체)"}
        </button>
        {status && <span style={{ alignSelf: "center", fontSize: 13, color: "#333" }}>{status}</span>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={th}>Case No</th>
            <th style={th}>제목</th>
            <th style={th}>마감일</th>
            <th style={th}>남은 일수</th>
            <th style={th}>상태</th>
            <th style={th}>동작</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#888" }}>
                향후 60일 마감 없음
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={td}>{r.caseNo ?? r.id.slice(0, 8)}</td>
              <td style={td}>{r.title}</td>
              <td style={td}>{new Date(r.dueDate).toLocaleString("ko-KR")}</td>
              <td style={{ ...td, color: r.daysLeft <= 3 ? "#c00" : "#333" }}>{r.daysLeft}일</td>
              <td style={td}>
                {r.synced ? (
                  <span style={{ color: "#0a7", fontWeight: 600 }}>동기됨</span>
                ) : (
                  <span style={{ color: "#888" }}>미동기</span>
                )}
              </td>
              <td style={td}>
                <button onClick={() => syncOne(r.id)} disabled={busy !== null} style={btn}>
                  {busy === r.id ? "..." : "Google Calendar 동기화"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: 8, textAlign: "left", borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: 8, verticalAlign: "top" };
const btn: React.CSSProperties = {
  padding: "6px 10px",
  background: "#06c",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
};
const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#0a7",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: 500,
};
