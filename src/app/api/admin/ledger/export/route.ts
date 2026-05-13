import {
  buildCaseLedgerCsv,
  listCaseLedgerRows,
  normalizeLedgerFilters
} from "@/lib/services/case-ledger-view-model";

export const dynamic = "force-dynamic";

function buildFileDate() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = normalizeLedgerFilters({
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    status: url.searchParams.get("status"),
    matterType: url.searchParams.get("matterType"),
    assignedTo: url.searchParams.get("assignedTo")
  });
  const viewModel = await listCaseLedgerRows(filters);
  const csv = buildCaseLedgerCsv(viewModel.rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="case-ledger-${buildFileDate()}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
