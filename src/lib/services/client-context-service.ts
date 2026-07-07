/**
 * 의뢰인 컨텍스트 자동 로딩 서비스.
 *
 * 이메일(또는 전화번호)로 의뢰인 이력을 즉시 조회합니다:
 *  - 프로필 (연락처·최근 활동)
 *  - 문의 (Inquiry, 최근 10)
 *  - 사건 (CaseMatter — 활성/종결 분리, 최근 20)
 *  - 사건별 최근 이벤트 (메시지 대체)
 *  - 포털 업로드 서류 (최근 20)
 *  - 결제 이력 (최근 10)
 *  - 노트 (accountingMemo 기반 상위 5)
 *
 * 5분 캐시 (email 단위).
 * Feature flag: `client_context_sidebar`.
 */

import { prisma } from "@/lib/prisma/client";

const CACHE_MS = 5 * 60 * 1000;

export type ClientContextProfile = {
  email: string;
  phone?: string | null;
  displayName: string;
  organizationName?: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
};

export type ClientContextInquiry = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  type: string;
};

export type ClientContextCase = {
  id: string;
  title: string;
  caseNo: string | null;
  status: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ClientContextEvent = {
  id: string;
  caseId: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export type ClientContextDocument = {
  id: string;
  fileName: string;
  uploadedAt: string;
};

export type ClientContextPayment = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  caseId: string | null;
};

export type ClientContextNote = {
  caseId: string;
  memo: string;
  updatedAt: string;
};

export type ClientContext = {
  profile: ClientContextProfile;
  cases: {
    active: ClientContextCase[];
    closed: ClientContextCase[];
  };
  inquiries: ClientContextInquiry[];
  messages: ClientContextEvent[];
  docs: ClientContextDocument[];
  payments: ClientContextPayment[];
  notes: ClientContextNote[];
  loadedAt: string;
};

const _cache = new Map<string, { at: number; ctx: ClientContext }>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function invalidateClientContext(email?: string) {
  if (email) _cache.delete(normalizeEmail(email));
  else _cache.clear();
}

export async function loadClientContext(rawEmail: string): Promise<ClientContext | null> {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return null;

  const cached = _cache.get(email);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.ctx;

  const [inquiries, portalClient] = await Promise.all([
    prisma.inquiry.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        inquiryType: true,
        contactName: true,
        organizationName: true,
        phone: true,
      },
    }),
    prisma.portalClient
      .findFirst({ where: { email }, select: { id: true, name: true, phone: true } })
      .catch(() => null),
  ]);

  const first = inquiries[inquiries.length - 1];
  const last = inquiries[0];

  const parties = await prisma.caseParty.findMany({
    where: { email, role: "CLIENT" },
    select: {
      caseMatter: {
        select: {
          id: true,
          title: true,
          caseNo: true,
          status: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          closedAt: true,
          accountingMemo: { select: { ledgerMemo: true, paymentMemo: true, updatedAt: true } },
        },
      },
    },
    take: 30,
  });

  const cases: ClientContextCase[] = parties
    .map((p) => p.caseMatter)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      id: c.id,
      title: c.title,
      caseNo: c.caseNo,
      status: c.status,
      category: c.category,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      closedAt: c.closedAt?.toISOString() ?? null,
    }));

  const activeCases = cases.filter((c) => c.status !== "CLOSED" && c.status !== "CANCELLED");
  const closedCases = cases.filter((c) => c.status === "CLOSED" || c.status === "CANCELLED");

  const caseIds = cases.map((c) => c.id);

  const [events, docs, payments] = await Promise.all([
    caseIds.length
      ? prisma.caseEvent
          .findMany({
            where: { caseId: { in: caseIds } },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              caseId: true,
              eventType: true,
              message: true,
              createdAt: true,
            },
          })
          .catch(() => [])
      : Promise.resolve([] as Array<{ id: string; caseId: string; eventType: string; message: string; createdAt: Date }>),
    prisma.portalUploadedFile
      .findMany({
        where: { client: { email } },
        orderBy: { uploadedAt: "desc" },
        take: 20,
        select: { id: true, fileName: true, uploadedAt: true },
      })
      .catch(() => []),
    prisma.payment
      .findMany({
        where: { customerEmail: email },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, status: true, createdAt: true, caseId: true },
      })
      .catch(() => []),
  ]);

  const notes: ClientContextNote[] = parties
    .map((p) => p.caseMatter)
    .filter((c): c is NonNullable<typeof c> => Boolean(c?.accountingMemo?.ledgerMemo))
    .slice(0, 5)
    .map((c) => ({
      caseId: c.id,
      memo: c.accountingMemo!.ledgerMemo ?? "",
      updatedAt: c.accountingMemo!.updatedAt.toISOString(),
    }));

  const displayName = last?.contactName ?? portalClient?.name ?? email;
  const phone = last?.phone ?? portalClient?.phone ?? null;

  const ctx: ClientContext = {
    profile: {
      email,
      phone,
      displayName,
      organizationName: last?.organizationName ?? null,
      firstSeenAt: first?.createdAt.toISOString() ?? null,
      lastSeenAt: last?.createdAt.toISOString() ?? null,
    },
    cases: { active: activeCases, closed: closedCases },
    inquiries: inquiries.map((q) => ({
      id: q.id,
      title: q.title,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
      type: q.inquiryType,
    })),
    messages: events.map((e) => ({
      id: e.id,
      caseId: e.caseId,
      eventType: e.eventType,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
    docs: docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      caseId: p.caseId,
    })),
    notes,
    loadedAt: new Date().toISOString(),
  };

  _cache.set(email, { at: Date.now(), ctx });
  return ctx;
}
