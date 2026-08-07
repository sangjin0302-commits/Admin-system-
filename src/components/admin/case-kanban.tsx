"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { CaseProgressBar } from "@/components/admin/case-progress-bar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KanbanItem {
  id: string;
  title: string;
  caseNo: string | null;
  status: string;
  matterTypeLabel: string;
  /** ISO timestamp, used as `expectedUpdatedAt` for optimistic-concurrency on drag-to-update. */
  updatedAt?: string;
}

interface CaseKanbanProps {
  items: KanbanItem[];
  onStatusChange: (caseId: string, newStatus: string, expectedUpdatedAt?: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

const COLUMNS = [
  { status: "INTAKE", label: "접수" },
  { status: "CONSULTATION", label: "상담중" },
  { status: "QUOTE_SENT", label: "견적발송" },
  { status: "IN_PROGRESS", label: "진행중" },
  { status: "COMPLETED", label: "완료" },
] as const;

type ColumnStatus = (typeof COLUMNS)[number]["status"];

/** Map the 16 CaseMatter statuses to the 5 kanban columns. */
function toColumnStatus(raw: string): ColumnStatus {
  switch (raw) {
    case "INTAKE_REVIEW":
      return "INTAKE";
    case "CONSULTING":
      return "CONSULTATION";
    case "QUOTED":
    case "CONTRACT_PENDING":
      return "QUOTE_SENT";
    case "OPEN":
    case "DOCUMENT_COLLECTING":
    case "DOCUMENT_REVIEWING":
    case "READY_TO_SUBMIT":
    case "SUBMITTED":
    case "SUPPLEMENT_REQUESTED":
    case "WAITING_AGENCY":
      return "IN_PROGRESS";
    case "RESULT_RECEIVED":
    case "CLOSING":
    case "CLOSED":
      return "COMPLETED";
    case "CANCELLED":
    case "ON_HOLD":
      return "COMPLETED";
    default:
      return "INTAKE";
  }
}

/**
 * The column-to-status mapping is many-to-one (16 statuses -> 5 columns), so
 * dropping a card into a column has no single "reverse" status. Each column
 * is instead given a representative target status to PATCH to when a card is
 * dropped into it:
 *  - INTAKE / CONSULTATION / QUOTE_SENT are effectively 1:1 (or pick the
 *    status that matches the column's own name).
 *  - IN_PROGRESS -> OPEN: the earliest status in the group, and the status
 *    reachable from every column to its left (QUOTED, CONTRACT_PENDING), so
 *    dragging a case "into progress" is the most broadly legal transition.
 *  - COMPLETED -> CLOSED: the terminal, successful-completion status, matching
 *    the "완료" (done) label. ON_HOLD/CANCELLED also render in this column,
 *    but a CLOSED target is the sensible destination for a fresh drag.
 * Illegal transitions (e.g. dragging an INTAKE card straight to COMPLETED)
 * are rejected server-side by CaseMatterStatusGuardError and surfaced as a
 * toast in kanban-shell.tsx.
 */
const REPRESENTATIVE_STATUS_BY_COLUMN: Record<ColumnStatus, string> = {
  INTAKE: "INTAKE_REVIEW",
  CONSULTATION: "CONSULTING",
  QUOTE_SENT: "QUOTED",
  IN_PROGRESS: "OPEN",
  COMPLETED: "CLOSED"
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CaseKanban({ items, onStatusChange }: CaseKanbanProps) {
  // Bucket items into columns
  const buckets = new Map<string, KanbanItem[]>();
  for (const col of COLUMNS) buckets.set(col.status, []);
  for (const item of items) {
    const col = toColumnStatus(item.status);
    buckets.get(col)!.push(item);
  }

  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newColumn = destination.droppableId as ColumnStatus;
    const item = items.find((i) => i.id === draggableId);
    if (!item) return;
    if (toColumnStatus(item.status) === newColumn) return;
    const targetStatus = REPRESENTATIVE_STATUS_BY_COLUMN[newColumn];
    onStatusChange(draggableId, targetStatus, item.updatedAt);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colItems = buckets.get(col.status) ?? [];
          return (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              items={colItems}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}

/* ------------------------------------------------------------------ */
/*  Column                                                             */
/* ------------------------------------------------------------------ */

function Column({
  status,
  label,
  items,
}: {
  status: string;
  label: string;
  items: KanbanItem[];
}) {
  return (
    <div className="flex min-h-[420px] flex-col rounded-xl border border-line bg-surface-muted">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-xl bg-primary px-4 py-3">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold text-white">
          {items.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-2 p-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-primary-soft/30" : ""
            }`}
          >
            {items.map((item, idx) => (
              <KanbanCard key={item.id} item={item} index={idx} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

function KanbanCard({ item, index }: { item: KanbanItem; index: number }) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg border border-line bg-surface p-3 shadow-panel transition-shadow duration-[var(--motion-fast)] ${
            snapshot.isDragging
              ? "shadow-floating ring-1 ring-primary/30"
              : "hover:shadow-floating"
          }`}
        >
          <p className="text-sm font-semibold text-text-strong line-clamp-2">
            {item.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.caseNo && (
              <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
                {item.caseNo}
              </span>
            )}
            <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
              {item.matterTypeLabel}
            </span>
          </div>

          <div className="mt-2">
            <CaseProgressBar status={item.status} showLabels={false} />
          </div>
        </div>
      )}
    </Draggable>
  );
}
