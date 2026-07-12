"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
}

/* ------------------------------------------------------------------ */
/*  CSV export                                                         */
/* ------------------------------------------------------------------ */

function downloadCsv(rows: Record<string, unknown>[], headers: string[], filename: string) {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InquiryDataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pageSize, setPageSize] = useState(10);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* CSV export — visible (filtered) rows only */
  const handleExport = () => {
    const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== "actions");
    const headers = visibleCols.map((c) => c.id);
    const rows = table.getFilteredRowModel().rows.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const col of visibleCols) {
        obj[col.id] = r.getValue(col.id);
      }
      return obj;
    });
    downloadCsv(rows, headers, `inquiries-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const [visDropdownOpen, setVisDropdownOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Global filter */}
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="검색..."
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text"
        >
          {[10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s}건
            </option>
          ))}
        </select>

        {/* Column visibility */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setVisDropdownOpen((v) => !v)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            컬럼 표시
          </button>
          {visDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-line bg-surface p-2 shadow-lg">
              {table.getAllLeafColumns().map((column) => (
                <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* CSV export */}
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
        >
          CSV 내보내기
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-xs uppercase text-text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer select-none whitespace-nowrap px-4 py-3"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-surface-muted">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {table.getFilteredRowModel().rows.length}건 중{" "}
          {table.getState().pagination.pageIndex * pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="rounded-lg border border-line px-3 py-1.5 text-sm transition hover:bg-surface-muted disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="rounded-lg border border-line px-3 py-1.5 text-sm transition hover:bg-surface-muted disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
