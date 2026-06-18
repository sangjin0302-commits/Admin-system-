import { NextResponse } from "next/server";
import { classifyInquiry } from "@/lib/services/ai-classification-service";

export async function POST(request: Request) {
  try {
    const { name, message, title } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "메시지 필요" }, { status: 400 });
    }
    const result = await classifyInquiry(name ?? "", message, title);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Classification error:", err);
    return NextResponse.json({ error: "분류 실패" }, { status: 500 });
  }
}
