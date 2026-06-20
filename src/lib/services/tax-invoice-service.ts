import { logger } from "@/lib/utils/logger";
export type TaxInvoiceRequest = {
  caseId: string;
  clientName: string;
  clientBizNo: string;
  amount: number;
  itemDescription: string;
};

export type TaxInvoiceResult = {
  invoiceId: string;
  status: "issued" | "pending" | "failed";
  xmlPayload?: string;
  issuedAt: Date;
};

const HOMETAX_KEY = process.env.HOMETAX_API_KEY;
const WETAX_KEY = process.env.WETAX_API_KEY;

const store: TaxInvoiceResult[] = [];
const requestMap = new Map<string, TaxInvoiceRequest>();

function buildXmlPayload(req: TaxInvoiceRequest, invoiceId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TaxInvoice>
  <InvoiceId>${invoiceId}</InvoiceId>
  <CaseId>${req.caseId}</CaseId>
  <Client>
    <Name>${req.clientName}</Name>
    <BizNo>${req.clientBizNo}</BizNo>
  </Client>
  <Item>${req.itemDescription}</Item>
  <Amount>${req.amount}</Amount>
</TaxInvoice>`;
}

export async function issueInvoice(
  req: TaxInvoiceRequest
): Promise<TaxInvoiceResult> {
  const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
  const xmlPayload = buildXmlPayload(req, invoiceId);

  let status: TaxInvoiceResult["status"] = "issued";

  if (HOMETAX_KEY || WETAX_KEY) {
    try {
      // Real integration would POST xmlPayload to Hometax/Wetax endpoint here.
      // We keep a stub call structure.
      const apiKey = HOMETAX_KEY ?? WETAX_KEY!;
      const res = await fetch("https://teht.hometax.go.kr/api/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          Authorization: `Bearer ${apiKey}`,
        },
        body: xmlPayload,
      }).catch(() => null);
      if (!res || !res.ok) status = "pending";
    } catch {
      status = "failed";
    }
  } else {
    logger.debug("[tax-invoice:mock] issued", invoiceId);
  }

  const result: TaxInvoiceResult = {
    invoiceId,
    status,
    xmlPayload,
    issuedAt: new Date(),
  };
  store.unshift(result);
  requestMap.set(invoiceId, req);
  return result;
}

export async function getInvoiceStatus(invoiceId: string): Promise<string> {
  const found = store.find((r) => r.invoiceId === invoiceId);
  return found?.status ?? "unknown";
}

export async function listRecentInvoices(
  limit = 20
): Promise<TaxInvoiceResult[]> {
  return store.slice(0, limit);
}
