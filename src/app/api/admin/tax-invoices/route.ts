import { NextResponse } from "next/server";
import {
  issueInvoice,
  listRecentInvoices,
} from "@/lib/services/tax-invoice-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoice = await issueInvoice({
      caseId: String(body.caseId ?? ""),
      clientName: String(body.clientName ?? ""),
      clientBizNo: String(body.clientBizNo ?? ""),
      amount: Number(body.amount ?? 0),
      itemDescription: String(body.itemDescription ?? ""),
    });
    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const invoices = await listRecentInvoices(limit);
  return NextResponse.json({ invoices });
}
