"use client";

import { useState } from "react";

import type { BusinessReport } from "@/lib/services/business-report-service";

type Props = {
  report: BusinessReport;
  html: string;
  markdown: string;
};

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportActions({ report, html, markdown }: Props) {
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const base = `${report.period}-report-${report.endDate.toISOString().slice(0, 10)}`;

  async function sendEmail() {
    setSending(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: report.period, action: "email" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEmailStatus("Email queued.");
    } catch (e) {
      setEmailStatus(
        `Failed: ${e instanceof Error ? e.message : "unknown error"}`,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => downloadBlob(html, `${base}.html`, "text/html")}
        className="rounded px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "#1a3c5f" }}
      >
        Download HTML
      </button>
      <button
        type="button"
        onClick={() =>
          downloadBlob(markdown, `${base}.md`, "text/markdown")
        }
        className="rounded px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "#c9a961" }}
      >
        Download Markdown
      </button>
      <button
        type="button"
        onClick={sendEmail}
        disabled={sending}
        className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ borderColor: "#1a3c5f", color: "#1a3c5f" }}
      >
        {sending ? "Sending..." : "Email Report"}
      </button>
      {emailStatus && (
        <span className="text-sm text-gray-600">{emailStatus}</span>
      )}
    </div>
  );
}
