import { NextResponse } from "next/server";
import { createTask, getTasks } from "@/lib/services/computer-use-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ tasks: getTasks() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string; instruction?: string };
    if (!body.title || !body.instruction) {
      return NextResponse.json(
        { error: "title and instruction are required" },
        { status: 400 },
      );
    }
    const task = createTask(body.title, body.instruction);
    return NextResponse.json({ task });
  } catch (err) {
    console.error("[admin/computer-use] POST failed", err);
    return NextResponse.json(
      { error: "failed" },
      { status: 500 },
    );
  }
}
