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
import { portalUserKey, requirePortalUser } from "@/lib/security/portal-auth";

// 신원은 세션에서만 얻는다. 예전에는 ?userId=/x-portal-user 헤더/본문 userId 를
// 그대로 믿어서 남의 서류 배송·공증 요청 내역을 조회하고 남의 이름으로
// 배송·공증을 접수할 수 있었다.

export async function GET() {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);
  const [shipping, notary] = await Promise.all([
    listShippingRequests({ userId }),
    listNotaryRequests({ userId }),
  ]);
  return NextResponse.json({ ok: true, shipping, notary });
}

export async function POST(req: Request) {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);

  // 본문의 userId 는 무시한다 — 요청 주체는 언제나 로그인한 본인이다.
  const body = (await req.json().catch(() => null)) as
    | {
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
  if (!body?.kind) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

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
