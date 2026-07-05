"use client";

import { useEffect, useState } from "react";

export type AdminPresence = {
  adminId: string;
  adminName?: string;
  lastSeenAt: string;
  currentPath?: string;
  editingEntityType?: string;
  editingEntityId?: string;
};

const HEARTBEAT_MS = 30_000;

let _activeAdmins: AdminPresence[] = [];
const listeners = new Set<(list: AdminPresence[]) => void>();

function notify() {
  for (const fn of listeners) fn(_activeAdmins);
}

let _started = false;
let _eventSource: EventSource | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;

async function sendHeartbeat(input: {
  currentPath?: string;
  editingEntityType?: string;
  editingEntityId?: string;
  adminName?: string;
} = {}) {
  try {
    const res = await fetch("/api/admin/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", ...input }),
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { active?: AdminPresence[] };
      if (Array.isArray(data.active)) {
        _activeAdmins = data.active;
        notify();
      }
    }
  } catch {
    /* ignore */
  }
}

function ensureStarted() {
  if (_started) return;
  _started = true;
  try {
    _eventSource = new EventSource("/api/admin/presence/stream");
    _eventSource.addEventListener("presence", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { presence?: AdminPresence[] };
        if (Array.isArray(data.presence)) {
          _activeAdmins = data.presence;
          notify();
        }
      } catch {
        /* ignore */
      }
    });
    _eventSource.onerror = () => {
      // silent — 브라우저가 자동 재접속
    };
  } catch {
    /* SSE 미지원 브라우저 — 폴링만 사용 */
  }
  _heartbeatTimer = setInterval(() => {
    void sendHeartbeat();
  }, HEARTBEAT_MS);
  void sendHeartbeat();
}

export function usePresence(input: {
  entityType?: string;
  entityId?: string;
  adminName?: string;
} = {}): {
  activeAdmins: AdminPresence[];
  currentEditor: AdminPresence | null;
} {
  const [list, setList] = useState<AdminPresence[]>(_activeAdmins);

  useEffect(() => {
    ensureStarted();
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  useEffect(() => {
    // entity 편집 컨텍스트 하트비트
    void sendHeartbeat({
      ...(typeof window !== "undefined" ? { currentPath: window.location.pathname } : {}),
      ...(input.entityType ? { editingEntityType: input.entityType } : {}),
      ...(input.entityId ? { editingEntityId: input.entityId } : {}),
      ...(input.adminName ? { adminName: input.adminName } : {}),
    });
  }, [input.entityType, input.entityId, input.adminName]);

  const currentEditor =
    input.entityType && input.entityId
      ? list.find(
          (p) =>
            p.editingEntityType === input.entityType &&
            p.editingEntityId === input.entityId
        ) ?? null
      : null;

  return { activeAdmins: list, currentEditor };
}
