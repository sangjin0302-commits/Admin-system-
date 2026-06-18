import { buildCaseLedgerCsv, type CaseLedgerRow } from "@/lib/services/case-ledger-view-model";

function buildFileDate() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export function buildCaseLedgerExportResponse(rows: CaseLedgerRow[], fileDate = buildFileDate()) {
  const csv = buildCaseLedgerCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="case-ledger-${fileDate}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
