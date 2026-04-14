import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/session";

export function authErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: 400 }
  );
}
