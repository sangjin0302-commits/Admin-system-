"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import type { FeeTable, FeeTableEntry, FeeAdjustments } from "@/lib/services/fee-estimator-service";

type Props = {
  initialTable: FeeTable;
  initialAdjustments: FeeAdjustments;
};

type EditableRow = {
  service: string;
  min: number;
  max: number;
  note?: string;
};

type EditableTable = Record<string, EditableRow[]>;

function tableToEditable(t: FeeTable): EditableTable {
  const out: EditableTable = {};
  for (const [cat, services] of Object.entries(t)) {
    out[cat] = Object.entries(services).map(([service, entry]) => ({
      service,
      min: entry.min,
      max: entry.max,
      note: entry.note,
    }));
  }
  return out;
}

function editableToTable(e: EditableTable): FeeTable {
  const out: FeeTable = {};
  for (const [cat, rows] of Object.entries(e)) {
    const services: Record<string, FeeTableEntry> = {};
    for (const row of rows) {
      if (!row.service.trim()) continue;
      services[row.service] = {
        min: Number(row.min) || 0,
        max: Number(row.max) || 0,
        ...(row.note ? { note: row.note } : {}),
      };
    }
    out[cat] = services;
  }
  return out;
}

export function FeeTableEditor({ initialTable, initialAdjustments }: Props) {
  const [editable, setEditable] = useState<EditableTable>(() => tableToEditable(initialTable));
  const [adjustments, setAdjustments] = useState<FeeAdjustments>(initialAdjustments);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);

  function updateRow(cat: string, idx: number, patch: Partial<EditableRow>) {
    setEditable((prev) => {
      const next = { ...prev };
      const rows = [...(next[cat] ?? [])];
      rows[idx] = { ...rows[idx], ...patch };
      next[cat] = rows;
      return next;
    });
  }

  function deleteRow(cat: string, idx: number) {
    setEditable((prev) => {
      const next = { ...prev };
      next[cat] = (next[cat] ?? []).filter((_, i) => i !== idx);
      return next;
    });
  }

  function addRow(cat: string) {
    setEditable((prev) => {
      const next = { ...prev };
      next[cat] = [...(next[cat] ?? []), { service: "", min: 0, max: 0 }];
      return next;
    });
  }

  function deleteCategory(cat: string) {
    if (!confirm(`카테고리 "${cat}"를 삭제하시겠습니까?`)) return;
    setEditable((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (editable[name]) {
      toast.error("이미 존재하는 카테고리입니다.");
      return;
    }
    setEditable((prev) => ({ ...prev, [name]: [] }));
    setNewCategoryName("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const table = editableToTable(editable);
      const res = await fetch("/api/admin/fee-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, adjustments }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `저장 실패 (${res.status})`);
      }
      toast.success("저장되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("정말로 기본값으로 초기화하시겠습니까? 모든 수정사항이 사라집니다.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/fee-table", { method: "DELETE" });
      if (!res.ok) throw new Error("초기화 실패");
      toast.success("기본값으로 초기화되었습니다. 페이지를 새로고침합니다.");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "초기화 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-strong">조정 계수</h3>
          <Link
            href="/admin/fee-estimator"
            className="text-xs text-text-muted hover:text-text-strong"
          >
            ← 견적기로 돌아가기
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["urgencyHigh", "urgencyCritical", "complexity", "company"] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{ADJ_LABELS[key]}</span>
              <input
                type="number"
                step="0.05"
                min="1"
                value={adjustments[key]}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 1 }))
                }
                className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm"
              />
            </label>
          ))}
        </div>
      </Card>

      {Object.entries(editable).map(([cat, rows]) => (
        <Card key={cat} className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-strong">{cat}</h3>
            <button
              type="button"
              onClick={() => deleteCategory(cat)}
              className="text-xs text-danger hover:underline"
            >
              카테고리 삭제
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-text-muted">
              <div className="col-span-4">서비스명</div>
              <div className="col-span-2">최소 (원)</div>
              <div className="col-span-2">최대 (원)</div>
              <div className="col-span-3">비고</div>
              <div className="col-span-1"></div>
            </div>
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  className="col-span-4 rounded-lg border border-line bg-surface p-2 text-sm"
                  value={row.service}
                  onChange={(e) => updateRow(cat, idx, { service: e.target.value })}
                  placeholder="서비스명"
                />
                <input
                  type="number"
                  className="col-span-2 rounded-lg border border-line bg-surface p-2 text-sm"
                  value={row.min}
                  onChange={(e) => updateRow(cat, idx, { min: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="col-span-2 rounded-lg border border-line bg-surface p-2 text-sm"
                  value={row.max}
                  onChange={(e) => updateRow(cat, idx, { max: Number(e.target.value) })}
                />
                <input
                  className="col-span-3 rounded-lg border border-line bg-surface p-2 text-sm"
                  value={row.note ?? ""}
                  onChange={(e) => updateRow(cat, idx, { note: e.target.value })}
                  placeholder="(선택)"
                />
                <button
                  type="button"
                  onClick={() => deleteRow(cat, idx)}
                  className="col-span-1 rounded-lg border border-line bg-surface px-2 text-xs text-danger hover:bg-surface-muted"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addRow(cat)}
              className="mt-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-muted"
            >
              + 서비스 추가
            </button>
          </div>
        </Card>
      ))}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">새 카테고리 추가</h3>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="카테고리 키 (예: NEW_CATEGORY)"
            className="flex-1 rounded-lg border border-line bg-surface p-2 text-sm"
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-text-strong hover:bg-surface-muted"
          >
            추가
          </button>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-danger hover:bg-surface-muted disabled:opacity-50"
        >
          기본값으로 초기화
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

const ADJ_LABELS: Record<keyof FeeAdjustments, string> = {
  urgencyHigh: "긴급도 HIGH 배수",
  urgencyCritical: "긴급도 CRITICAL 배수",
  complexity: "복잡 요소 배수",
  company: "법인 의뢰인 배수",
};
