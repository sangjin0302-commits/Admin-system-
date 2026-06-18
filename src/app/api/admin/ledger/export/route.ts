import {
  listCaseLedgerRows,
  normalizeLedgerFilters
} from "@/lib/services/case-ledger-view-model";
import { buildCaseLedgerExportResponse } from "./ledger-export-helpers";

export const dynamic = "force-dynamic";

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
  return buildCaseLedgerExportResponse(viewModel.rows);
}
