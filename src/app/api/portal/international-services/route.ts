import { NextResponse } from "next/server";
import {
  createShippingRequest,
  listShippingRequests,
  estimateShippingCost,
  type ShippingAddress,
  type ShippingService,
} from "@/lib/services/document-shipping-service";
import {
  createNotaryRequest,
  estimateNotaryCost,
  listRequests as listNotaryRequests,
  type NotaryDelivery,
  type NotaryDocType,
  type NotaryUrgency,
} from "@/lib/services/notary-integration-service";

function resolveUserId(req: Request, body?: { userId?: string }): string | null {
  if (body?.userId) return body.userId;
  const url = new URL(req.url);
  return url.searchParams.get("userId") ?? url.searchParams.get("email") ?? req.headers.get("x-portal-user");
}

export async function GET(req: Request) {
  const userId = resolveUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 400 });
  const [shipping, notary] = await Promise.all([
    listShippingRequests({ userId }),
    listNotaryRequests({ userId }),
  ]);
  return NextResponse.json({ ok: true, shipping, notary });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        userId?: string;
        kind?: "shipping" | "notary" | "shipping.estimate" | "notary.estimate";
        shipping?: {
          caseId?: string;
          documents: string[];
          destination: ShippingAddress;
          service: ShippingService;
          notes?: string;
        };
        notary?: {
          caseId?: string;
          documentType: NotaryDocType;
          documentTitle: string;
          urgency: NotaryUrgency;
          delivery: NotaryDelivery;
          destinationAddress?: string;
          notes?: string;
        };
      }
    | null;
  const userId = resolveUserId(req, body ?? undefined);
  if (!userId || !body?.kind) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  if (body.kind === "shipping.estimate" && body.shipping) {
    const cost = estimateShippingCost(body.shipping.destination, body.shipping.service, body.shipping.documents.length * 5);
    return NextResponse.json({ ok: true, costKrw: cost });
  }
  if (body.kind === "notary.estimate" && body.notary) {
    const cost = estimateNotaryCost(body.notary.documentType, body.notary.urgency, body.notary.delivery);
    return NextResponse.json({ ok: true, costKrw: cost });
  }
  if (body.kind === "shipping" && body.shipping) {
    const record = await createShippingRequest({ userId, ...body.shipping });
    return NextResponse.json({ ok: true, request: record });
  }
  if (body.kind === "notary" && body.notary) {
    const record = await createNotaryRequest({ userId, ...body.notary });
    return NextResponse.json({ ok: true, request: record });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN" }, { status: 400 });
}
