"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDateTime } from "@/lib/utils";

type PublicIntakeControlSnapshot = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  retryAfterSec: number;
  source: "env" | "db";
  updatedAt: string | null;
  updatedBy: string | null;
};

type PublicIntakeControlHistoryEntry = {
  id: string;
  importedAt: string;
  version: string;
  maintenanceMode: boolean | null;
  maintenanceMessage: string | null;
  retryAfterSec: number | null;
  updatedBy: string | null;
  changeReason: string | null;
};

type PublicIntakeControlCapabilities = {
  writable: boolean;
  reason: string | null;
};

export function PublicIntakeControlCard({
  initialSnapshot,
  initialHistory,
  initialCapabilities
}: {
  initialSnapshot: PublicIntakeControlSnapshot;
  initialHistory: PublicIntakeControlHistoryEntry[];
  initialCapabilities: PublicIntakeControlCapabilities;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [snapshot, setSnapshot] = useState<PublicIntakeControlSnapshot>(initialSnapshot);
  const [history, setHistory] = useState<PublicIntakeControlHistoryEntry[]>(initialHistory);
  const [capabilities, setCapabilities] = useState<PublicIntakeControlCapabilities>(initialCapabilities);
  const [maintenanceMode, setMaintenanceMode] = useState(initialSnapshot.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(initialSnapshot.maintenanceMessage);
  const [retryAfterSec, setRetryAfterSec] = useState(initialSnapshot.retryAfterSec);
  const [changeReason, setChangeReason] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");

  function saveControl(
    nextMaintenanceMode: boolean,
    options?: {
      maintenanceMessage?: string;
      retryAfterSec?: number;
      changeReason?: string;
    }
  ) {
    if (!capabilities.writable) {
      setTone("error");
      setMessage(capabilities.reason || "현재는 읽기 전용 상태라 저장할 수 없습니다.");
      return;
    }

    setMessage("");
    startTransition(async () => {
      const nextMessage = options?.maintenanceMessage ?? maintenanceMessage;
      const nextRetryAfterSec = options?.retryAfterSec ?? retryAfterSec;
      const nextChangeReason = options?.changeReason ?? changeReason;
      const normalizedRetryAfterSec =
        Number.isFinite(nextRetryAfterSec) && nextRetryAfterSec >= 30 ? Math.trunc(nextRetryAfterSec) : 300;

      const hasMeaningfulChange =
        nextMaintenanceMode !== snapshot.maintenanceMode ||
        nextMessage.trim() !== snapshot.maintenanceMessage ||
        normalizedRetryAfterSec !== snapshot.retryAfterSec;
      if (hasMeaningfulChange && !nextChangeReason?.trim()) {
        setTone("error");
        setMessage("운영 변경 사유를 입력해 주세요.");
        return;
      }

      const response = await fetch("/api/admin/system/intake-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode: nextMaintenanceMode,
          maintenanceMessage: nextMessage,
          retryAfterSec: normalizedRetryAfterSec,
          updatedBy: "admin-ui",
          changeReason: nextChangeReason
        })
      });

      if (!response.ok) {
        setTone("error");
        setMessage(await parseClientApiError(response, "접수 운영 상태를 저장하지 못했습니다."));
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            snapshot?: PublicIntakeControlSnapshot;
            history?: PublicIntakeControlHistoryEntry[];
            capabilities?: PublicIntakeControlCapabilities;
          }
        | null;
      if (!payload?.snapshot) {
        setTone("error");
        setMessage("서버 응답 형식이 올바르지 않아 저장 결과를 확인하지 못했습니다.");
        return;
      }

      setSnapshot(payload.snapshot);
      setMaintenanceMode(payload.snapshot.maintenanceMode);
      setMaintenanceMessage(payload.snapshot.maintenanceMessage);
      setRetryAfterSec(payload.snapshot.retryAfterSec);
      if (Array.isArray(payload.history)) {
        setHistory(payload.history);
      }
      if (payload.capabilities) {
        setCapabilities(payload.capabilities);
      }
      setTone("success");
      setMessage(
        payload.snapshot.maintenanceMode
          ? "점검 모드를 활성화했습니다. 고객 접수는 즉시 차단됩니다."
          : "점검 모드를 해제했습니다. 고객 접수를 다시 받을 수 있습니다."
      );
      setChangeReason("");
      router.refresh();
    });
  }

  function restoreFromHistory(entry: PublicIntakeControlHistoryEntry) {
    const restoredMode = Boolean(entry.maintenanceMode);
    const restoredMessage = entry.maintenanceMessage || snapshot.maintenanceMessage;
    const restoredRetryAfterSec =
      typeof entry.retryAfterSec === "number" && Number.isFinite(entry.retryAfterSec)
        ? entry.retryAfterSec
        : snapshot.retryAfterSec;

    setMaintenanceMode(restoredMode);
    setMaintenanceMessage(restoredMessage);
    setRetryAfterSec(restoredRetryAfterSec);
    const restoreReason = `이력 복원 (${formatDateTime(entry.importedAt)})`;
    setChangeReason(restoreReason);
    saveControl(restoredMode, {
      maintenanceMessage: restoredMessage,
      retryAfterSec: restoredRetryAfterSec,
      changeReason: restoreReason
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-kicker">Public Intake Control</p>
          <h3 className="mt-2 ui-section-title">고객 접수 점검 모드 제어</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            snapshot.maintenanceMode ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
          }`}
        >
          {snapshot.maintenanceMode ? "점검 중" : "운영 중"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(event) => setMaintenanceMode(event.target.checked)}
            disabled={!capabilities.writable}
            className="h-4 w-4 rounded border-line-strong text-primary"
          />
          점검 모드 활성화
        </label>
        <div className="rounded-md border border-line bg-surface px-3 py-3 text-xs text-text-muted">
          설정 소스: {snapshot.source.toUpperCase()}
          {snapshot.updatedAt ? ` / 최근 변경: ${formatDateTime(snapshot.updatedAt)}` : ""}
          {snapshot.updatedBy ? ` / 변경자: ${snapshot.updatedBy}` : ""}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-text-strong">점검 안내 문구</p>
          <Input
            value={maintenanceMessage}
            maxLength={300}
            onChange={(event) => setMaintenanceMessage(event.target.value)}
            disabled={!capabilities.writable}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-text-strong">재시도 대기 시간(초)</p>
          <Input
            type="number"
            min={30}
            max={86400}
            value={String(retryAfterSec)}
            onChange={(event) => setRetryAfterSec(Number(event.target.value))}
            disabled={!capabilities.writable}
          />
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-2 text-sm font-medium text-text-strong">변경 사유</p>
        <Input
          value={changeReason}
          maxLength={300}
          onChange={(event) => setChangeReason(event.target.value)}
          placeholder="예: 서버 배포 점검, 장애 대응, 내부 테스트"
          disabled={!capabilities.writable}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" disabled={isPending || !capabilities.writable} onClick={() => saveControl(maintenanceMode)}>
          {isPending ? "저장 중..." : "설정 저장"}
        </Button>
        <Button type="button" variant="secondary" disabled={isPending || !capabilities.writable} onClick={() => saveControl(false)}>
          점검 해제
        </Button>
      </div>
      {!capabilities.writable ? (
        <div className="mt-3">
          <StateInline tone="error">{capabilities.reason || "읽기 전용 상태입니다."}</StateInline>
        </div>
      ) : null}
      {message ? <div className="mt-3"><StateInline tone={tone}>{message}</StateInline></div> : null}

      <div className="mt-5">
        <p className="ui-kicker">변경 이력</p>
        <div className="mt-2 space-y-2">
          {history.length === 0 ? (
            <div className="rounded-md border border-line bg-surface-muted px-3 py-3 text-sm text-text-muted">
              저장된 점검 모드 변경 이력이 없습니다.
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="rounded-md border border-line bg-surface px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span>{formatDateTime(entry.importedAt)}</span>
                  <span>·</span>
                  <span>{entry.updatedBy || "admin"}</span>
                  <span>·</span>
                  <span>{entry.version}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-text-strong">
                  상태: {entry.maintenanceMode ? "점검 모드 ON" : "점검 모드 OFF"}
                  {entry.retryAfterSec ? ` / 재시도 ${entry.retryAfterSec}초` : ""}
                </p>
                {entry.maintenanceMessage ? (
                  <p className="mt-1 text-sm text-text-muted">{entry.maintenanceMessage}</p>
                ) : null}
                {entry.changeReason ? (
                  <p className="mt-1 text-xs text-text-muted">사유: {entry.changeReason}</p>
                ) : null}
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending || !capabilities.writable}
                    onClick={() => restoreFromHistory(entry)}
                  >
                    이 설정으로 복원
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
