import { NextResponse } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { AuthError, authenticateAdminUser, createAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitKey(request: Request, email: string) {
  return `${getClientIp(request)}:${email.trim().toLowerCase()}`;
}

function getRateLimitState(key: string) {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginAttempts.set(key, next);
    return next;
  }

  return current;
}

function getBlockedState(key: string) {
  const state = getRateLimitState(key);
  return state.count >= LOGIN_MAX_ATTEMPTS ? state : null;
}

function recordFailedAttempt(key: string) {
  const state = getRateLimitState(key);
  state.count += 1;
  loginAttempts.set(key, state);
}

function clearFailedAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: Request) {
  let rateLimitKey: string | null = null;

  try {
    const payload = loginSchema.parse(await request.json());
    rateLimitKey = getRateLimitKey(request, payload.email);
    const blocked = getBlockedState(rateLimitKey);

    if (blocked) {
      const retryAfterSeconds = Math.max(1, Math.ceil((blocked.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString()
          }
        }
      );
    }

    const user = await authenticateAdminUser(payload.email, payload.password);
    await createAdminSession(user.id);
    clearFailedAttempts(rateLimitKey);
    await createAuditLog(prisma, {
      actor: { userId: user.id, email: user.email, role: user.role },
      actionType: "LOGIN",
      entityType: "AUTH",
      entityId: user.id,
      summary: `${user.email} logged in`
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (rateLimitKey) {
      recordFailedAttempt(rateLimitKey);
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값을 다시 확인해 주세요." }, { status: 400 });
    }

    console.error("Admin login failed", error);
    return NextResponse.json({ error: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
