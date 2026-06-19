import { NextResponse } from "next/server";

import { cacheClear } from "@/lib/services/cache-service";

export async function POST() {
  cacheClear();
  return NextResponse.json({ success: true });
}
