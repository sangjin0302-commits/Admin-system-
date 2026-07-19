"use client";

/**
 * 일괄 관리 — 여러 건을 선택해 한 번에 상태 이동·담당자 지정·삭제.
 *
 * 문의(/admin/inquiries)와 사건(/admin/cases)이 같은 컴포넌트를 쓴다. 두 화면의
 * bulk-action API 가 { ids, action, value } 라는 같은 계약을 쓰기 때문이다.
 *
 * 삭제는 되돌릴 수 없다 — 연결된 견적·사건·서류·과제가 Cascade 로 함께 사라진다.
 * 그래서 삭제만 2단계 확인(체크박스 + 버튼)을 요구하고 건수 상한도 더 낮다.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type BulkItem = {
  id: string;
  /** 목록에 굵게 표시되는 제목 */
  title: string;
  /** 제목 아래 회색 보조 설명 (담당자·상태·날짜 등) */
  subtitle: string;
};

export type BulkStatusOption = { value: string; label: string };

type Props = {
  items: BulkItem[];
  /** bulk-action API 경로 */
  endpoint: string;
  /** "상태 이동" 셀렉트에 넣을 값들 */
  statusOptions: BulkStatusOption[];
  /** "문의" / "사건" 등 화면에 쓰일 단위 명칭 */
  noun: string;
};

/** 삭제 API가 한 번에 받는 최대 건수. 서버(MAX_DELETE_IDS)와 맞춘다. */
const MAX_DELETE = 20;

export function BulkManager({ items, endpoint, statusOptions, noun }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState("");
  const [assignee, setAssignee] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
    );
  }, [items, filter]);

  const ids = useMemo(() => Array.from(selected), [selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmDelete(false);
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((i) => next.delete(i.id));
      else visible.forEach((i) => next.add(i.id));
      return next;
    });
    setConfirmDelete(false);
  }

  async function run(action: "status" | "assign" | "delete", value?: string) {
    if (ids.length === 0) {
      toast.error(`먼저 ${noun}를 선택하세요.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, value }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.message || json?.error || `실패 (${res.status})`);
        return;
      }

      const updated = json?.data?.updated ?? json?.updated ?? 0;
      toast.success(
        action === "delete" ? `${updated}건 삭제했습니다.` : `${updated}건 처리했습니다.`
      );
      setSelected(new Set());
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      toast.error(`요청 실패: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">Bulk Manage</p>
          <h3 className="mt-1 text-lg font-semibold text-text-strong">
            {noun} 일괄 이동 · 삭제
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            여러 {noun}를 선택해 상태를 한 번에 옮기거나, 테스트로 넣은 건을 삭제합니다.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "닫기" : "열기"}
        </Button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          {/* ── 선택 목록 ── */}
          <div className="rounded-2xl border border-line">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-strong">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-line"
                />
                보이는 {visible.length}건 전체 선택
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="목록 내 검색"
                  className="h-8 w-40 rounded-lg border border-line bg-surface px-3 text-xs"
                />
                <span className="text-xs text-text-muted">선택 {ids.length}건</span>
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {visible.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 border-b border-line/50 px-4 py-3 text-sm transition hover:bg-surface-muted"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text-strong">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{item.subtitle}</span>
                  </span>
                </label>
              ))}
              {visible.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* ── 상태 이동 ── */}
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4">
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-semibold text-text-strong">상태 이동</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">옮길 상태 선택</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              disabled={busy || !targetStatus || ids.length === 0}
              onClick={() => run("status", targetStatus)}
            >
              선택 {ids.length}건 이동
            </Button>
          </div>

          {/* ── 담당자 지정 ── */}
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4">
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-semibold text-text-strong">담당자 지정</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="담당자 이름"
                className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !assignee.trim() || ids.length === 0}
              onClick={() => run("assign", assignee.trim())}
            >
              선택 {ids.length}건 지정
            </Button>
          </div>

          {/* ── 삭제 (되돌릴 수 없음) ── */}
          <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
            <p className="text-sm font-semibold text-danger">삭제 (복구 불가)</p>
            <p className="mt-1 text-xs text-text-muted">
              선택한 {noun}와 연결된 견적·서류·과제가 함께 삭제됩니다. 되돌릴 수 없습니다. 한 번에
              최대 {MAX_DELETE}건.
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-text">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              위 내용을 확인했고, 선택한 {ids.length}건을 영구 삭제합니다.
            </label>
            <div className="mt-3">
              <Button
                type="button"
                variant="danger"
                disabled={busy || !confirmDelete || ids.length === 0 || ids.length > MAX_DELETE}
                onClick={() => run("delete")}
              >
                {ids.length > MAX_DELETE
                  ? `한 번에 ${MAX_DELETE}건까지`
                  : `선택 ${ids.length}건 삭제`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
