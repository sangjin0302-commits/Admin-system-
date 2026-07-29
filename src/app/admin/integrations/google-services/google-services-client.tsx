"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Scopes {
  calendar: boolean;
  drive: boolean;
  docs: boolean;
}

interface StatusResponse {
  ok: boolean;
  configured?: boolean;
  connected?: boolean;
  scopes?: Scopes;
}

interface LinkResult {
  label: string;
  links: { label: string; href: string }[];
}

const API = "/api/admin/google-services";

function ScopeBadge({ label, granted }: { label: string; granted: boolean }) {
  return (
    <span
      className={`ui-status-pill ${
        granted ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      }`}
    >
      {label} {granted ? "OK" : "미부여"}
    </span>
  );
}

export function GoogleServicesClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<LinkResult | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch(API);
      const j = (await res.json()) as StatusResponse;
      setStatus(j);
    } catch {
      setStatus({ ok: false });
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function post(action: string): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setMessage(null);
    setResult(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      return (await res.json()) as Record<string, unknown>;
    } catch (err) {
      setMessage(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onConnect() {
    const j = await post("connect-url");
    if (j?.ok && typeof j.url === "string") {
      window.location.href = j.url;
    } else {
      setMessage("연결 URL 생성 실패 — GOOGLE_CLIENT_ID 등 환경변수를 확인하세요.");
    }
  }

  async function onDisconnect() {
    const j = await post("disconnect");
    if (j?.ok) {
      setMessage("연결을 해제했습니다.");
      await loadStatus();
    } else {
      setMessage("연결 해제 실패");
    }
  }

  async function onTestDrive() {
    const j = await post("test-drive");
    if (!j?.ok) {
      setMessage(`Drive 테스트 실패: ${(j?.error as string) ?? "unknown"}`);
      return;
    }
    const folder = j.folder as { webViewLink?: string } | undefined;
    const file = j.file as { webViewLink?: string } | undefined;
    const links: { label: string; href: string }[] = [];
    if (folder?.webViewLink) links.push({ label: "사건자료 폴더 열기", href: folder.webViewLink });
    if (file?.webViewLink) links.push({ label: "테스트 파일 열기", href: file.webViewLink });
    setResult({ label: "Drive 테스트 성공", links });
  }

  async function onTestDocs() {
    const j = await post("test-docs");
    if (!j?.ok) {
      setMessage(`Docs 테스트 실패: ${(j?.error as string) ?? "unknown"}`);
      return;
    }
    const url = j.url as string | undefined;
    setResult({
      label: "Docs 테스트 성공",
      links: url ? [{ label: "테스트 문서 열기", href: url }] : [],
    });
  }

  async function onTestMeet() {
    const j = await post("test-meet");
    if (!j?.ok) {
      setMessage(`Meet 테스트 실패: ${(j?.error as string) ?? "unknown"}`);
      return;
    }
    const meetLink = j.meetLink as string | undefined;
    const htmlLink = j.htmlLink as string | undefined;
    const links: { label: string; href: string }[] = [];
    if (meetLink) links.push({ label: "Meet 링크 열기", href: meetLink });
    if (htmlLink) links.push({ label: "캘린더 이벤트 열기", href: htmlLink });
    setResult({ label: "Meet 테스트 성공", links });
  }

  const scopes = status?.scopes;

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연결 상태</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {status?.configured === false ? (
            <span className="ui-status-pill bg-danger/10 text-danger">환경변수 미설정</span>
          ) : status?.connected ? (
            <span className="ui-status-pill bg-success/10 text-success">연결됨</span>
          ) : (
            <span className="ui-status-pill bg-warning/10 text-warning">미연결</span>
          )}
          {scopes && (
            <>
              <ScopeBadge label="Calendar" granted={scopes.calendar} />
              <ScopeBadge label="Drive" granted={scopes.drive} />
              <ScopeBadge label="Docs" granted={scopes.docs} />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={onConnect}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            구글 연결 / 재연결
          </button>
          <button
            disabled={busy || !status?.connected}
            onClick={onDisconnect}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            연결 해제
          </button>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          재연결 시 Calendar · Drive · Docs 스코프에 대한 동의를 다시 요청합니다.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 테스트</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={onTestDrive}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            Drive 테스트
          </button>
          <button
            disabled={busy}
            onClick={onTestDocs}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            Docs 테스트
          </button>
          <button
            disabled={busy}
            onClick={onTestMeet}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            Meet 테스트
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-warning">{message}</p>}

        {result && (
          <div className="mt-4">
            <p className="text-sm font-medium text-success">{result.label}</p>
            {result.links.length === 0 ? (
              <p className="mt-1 text-sm text-text-muted">반환된 링크가 없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {result.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
