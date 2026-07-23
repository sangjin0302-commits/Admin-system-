import { NextResponse } from "next/server";

import {
  generateDocumentDraft,
  type DraftInput,
  type DraftType,
} from "@/lib/services/document-draft-generator-service";

const VALID_TYPES: DraftType[] = [
  "appeal",
  "complaint",
  "petition",
  "application",
  "objection",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DraftInput>;

    if (
      typeof body.type !== "string" ||
      !VALID_TYPES.includes(body.type as DraftType) ||
      typeof body.clientName !== "string" ||
      typeof body.agency !== "string" ||
      typeof body.subject !== "string" ||
      typeof body.facts !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid input payload" },
        { status: 400 }
      );
    }

    const draft = await generateDocumentDraft(body as DraftInput);
    return NextResponse.json(draft);
  } catch (error) {
    console.error("[admin/doc-generator] failed", error);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
