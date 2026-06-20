"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BackupSnapshot = {
  id: string;
  createdAt: string;
  tables: { name: string; rowCount: number }[];
  sizeBytes: number;
};

export function BackupControls({ initial }: { initial: BackupSnapshot[] }) {
  const [backups, setBackups] = useState<BackupSnapshot[]>(initial);
  const [simulation, setSimulation] = useState<{
    canRestore: boolean;
    warnings: string[];
    preview: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function createBackup() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (data.snapshot) {
        setBackups([data.snapshot, ...backups]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function simulateRestore(id: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup/restore-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: id }),
      });
      const data = await res.json();
      setSimulation(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">백업 스냅샷</h3>
          <Button onClick={createBackup} disabled={loading}>
            새 백업 생성
          </Button>
        </div>
        {backups.length === 0 ? (
          <p className="text-sm text-text-muted">백업이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {backups.map((b) => (
              <li
                key={b.id}
                className="flex items-start justify-between gap-3 rounded-md border border-line p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{b.id.slice(0, 8)}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(b.createdAt).toLocaleString()} · ~
                    {(b.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                    {b.tables.reduce((acc, t) => acc + t.rowCount, 0)} rows
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateRestore(b.id)}
                  disabled={loading}
                >
                  복원 시뮬레이션
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {simulation && (
        <Card className="p-6 space-y-2">
          <h3 className="text-base font-semibold">복원 시뮬레이션 결과</h3>
          <p className="text-sm">
            복원 가능: <strong>{simulation.canRestore ? "예" : "아니오"}</strong>
          </p>
          <div>
            <p className="text-xs uppercase text-text-muted">경고</p>
            <ul className="list-disc pl-5 text-sm">
              {simulation.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted">미리보기</p>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-muted p-3 text-xs">
              {simulation.preview}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
