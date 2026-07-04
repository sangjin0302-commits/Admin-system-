import { NextRequest, NextResponse } from "next/server";
import {
  EXPERIMENTS,
  AB_COOKIE_NAME,
  parseAbCookie,
  serializeAbCookie,
  getVariant,
} from "@/lib/ab";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(AB_COOKIE_NAME)?.value ?? null;
  const assignments = parseAbCookie(raw);

  // Assign any missing experiments
  for (const id of Object.keys(EXPERIMENTS)) {
    if (!assignments[id]) {
      assignments[id] = getVariant(id, null);
    }
  }

  const res = NextResponse.json(assignments);
  res.cookies.set(AB_COOKIE_NAME, serializeAbCookie(assignments), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
