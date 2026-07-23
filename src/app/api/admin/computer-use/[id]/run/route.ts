import { NextResponse } from "next/server";
import { executeTask } from "@/lib/services/computer-use-service";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = await executeTask(id);
    return NextResponse.json({ task });
  } catch (err) {
    console.error("[admin/computer-use/run] failed", err);
    return NextResponse.json(
      { error: "failed" },
      { status: 500 },
    );
  }
}
