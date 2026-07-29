/**
 * 상담 예약 슬롯 서비스 — Cal.com 스타일.
 *
 * 관리자 가용시간은 SiteSetting.key = `consult.availability` (JSON) 에 저장.
 * 각 슬롯은 Inquiry(source="booking", internalMemo에 bookedAt 메타) 로 예약됩니다.
 */

import { prisma } from "@/lib/prisma/client";

// ── 타입 ──────────────────────────────────────────────────────────────

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface AvailabilityConfig {
  weeklyPattern: Record<WeekdayKey, string[]>; // "HH:mm"
  blockedDates: string[]; // "YYYY-MM-DD"
  slotDurationMin: number;
}

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

export interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  weekday: WeekdayKey;
  slots: TimeSlot[];
}

// ── 기본값 ────────────────────────────────────────────────────────────

const WEEKDAYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  weeklyPattern: {
    sun: [],
    mon: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    tue: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    wed: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    thu: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    fri: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    sat: [],
  },
  blockedDates: [],
  slotDurationMin: 30,
};

// ── 유틸 ──────────────────────────────────────────────────────────────

function isTimeString(v: unknown): v is string {
  return typeof v === "string" && /^\d{2}:\d{2}$/.test(v);
}

function isDateString(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function toWeekday(date: Date): WeekdayKey {
  return WEEKDAYS[date.getDay()];
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(iso: string): Date | null {
  if (!isDateString(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

// ── 설정 로드/저장 ────────────────────────────────────────────────────

export function sanitizeAvailability(raw: unknown): AvailabilityConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_AVAILABILITY;
  const o = raw as Record<string, unknown>;

  const wpRaw = (o.weeklyPattern ?? {}) as Record<string, unknown>;
  const weeklyPattern = { ...DEFAULT_AVAILABILITY.weeklyPattern } as Record<WeekdayKey, string[]>;
  for (const day of WEEKDAYS) {
    const arr = wpRaw[day];
    if (Array.isArray(arr)) {
      const times = arr.filter(isTimeString).map((t) => t.trim());
      // 중복 제거 + 정렬
      weeklyPattern[day] = Array.from(new Set(times)).sort();
    }
  }

  const blockedRaw = o.blockedDates;
  const blockedDates = Array.isArray(blockedRaw)
    ? Array.from(new Set(blockedRaw.filter(isDateString))).sort()
    : [];

  const dur = typeof o.slotDurationMin === "number" && o.slotDurationMin > 0 ? Math.floor(o.slotDurationMin) : DEFAULT_AVAILABILITY.slotDurationMin;

  return { weeklyPattern, blockedDates, slotDurationMin: dur };
}

export async function getAvailabilityConfig(): Promise<AvailabilityConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "consult.availability" } });
    if (!row?.value) return DEFAULT_AVAILABILITY;
    return sanitizeAvailability(JSON.parse(row.value));
  } catch {
    return DEFAULT_AVAILABILITY;
  }
}

export async function saveAvailabilityConfig(input: unknown): Promise<AvailabilityConfig> {
  const clean = sanitizeAvailability(input);
  const value = JSON.stringify(clean);
  await prisma.siteSetting.upsert({
    where: { key: "consult.availability" },
    create: { key: "consult.availability", value },
    update: { value },
  });
  return clean;
}

// ── 슬롯 계산 ────────────────────────────────────────────────────────

/**
 * 이미 예약된 슬롯 조회 — Inquiry.intakeSource="booking" + internalMemo 의
 * `[BOOKING date=YYYY-MM-DD time=HH:mm]` 태그를 파싱.
 */
async function getBookedTimesForDate(dateIso: string): Promise<Set<string>> {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        intakeSource: "booking",
        internalMemo: { contains: `date=${dateIso}` },
      },
      select: { internalMemo: true },
    });
    const set = new Set<string>();
    for (const row of inquiries) {
      if (!row.internalMemo) continue;
      const m = row.internalMemo.match(/\[BOOKING date=(\d{4}-\d{2}-\d{2}) time=(\d{2}:\d{2})\]/);
      if (m && m[1] === dateIso) set.add(m[2]);
    }
    return set;
  } catch {
    return new Set();
  }
}

export async function getAvailableSlots(dateIso: string): Promise<TimeSlot[]> {
  const date = parseDate(dateIso);
  if (!date) return [];

  const config = await getAvailabilityConfig();
  if (config.blockedDates.includes(dateIso)) return [];

  const wd = toWeekday(date);
  const times = config.weeklyPattern[wd] ?? [];
  if (times.length === 0) return [];

  const booked = await getBookedTimesForDate(dateIso);
  return times.map((t) => ({ time: t, available: !booked.has(t) }));
}

export async function getSlotsForNext14Days(): Promise<DayAvailability[]> {
  const config = await getAvailabilityConfig();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayAvailability[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = formatDate(d);
    const wd = toWeekday(d);
    if (config.blockedDates.includes(iso)) {
      days.push({ date: iso, weekday: wd, slots: [] });
      continue;
    }
    const pattern = config.weeklyPattern[wd] ?? [];
    if (pattern.length === 0) {
      days.push({ date: iso, weekday: wd, slots: [] });
      continue;
    }
    const booked = await getBookedTimesForDate(iso);
    days.push({
      date: iso,
      weekday: wd,
      slots: pattern.map((t) => ({ time: t, available: !booked.has(t) })),
    });
  }
  return days;
}

// ── 예약 생성 ────────────────────────────────────────────────────────

export interface BookingInput {
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  message?: string;
}

export interface BookingResult {
  ok: boolean;
  inquiryId?: string;
  error?: string;
}

export async function bookSlot(input: BookingInput): Promise<BookingResult> {
  if (!isDateString(input.date)) return { ok: false, error: "INVALID_DATE" };
  if (!isTimeString(input.time)) return { ok: false, error: "INVALID_TIME" };
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name) return { ok: false, error: "NAME_REQUIRED" };
  if (!phone) return { ok: false, error: "PHONE_REQUIRED" };

  // 가용성 재확인
  const slots = await getAvailableSlots(input.date);
  const slot = slots.find((sl) => sl.time === input.time);
  if (!slot) return { ok: false, error: "SLOT_NOT_OFFERED" };
  if (!slot.available) return { ok: false, error: "SLOT_TAKEN" };

  const category = input.category?.trim() || "상담 예약";
  const email = input.email?.trim() || `booking-${Date.now()}@ethos-noemail.local`;
  const memoLines = [
    `[BOOKING date=${input.date} time=${input.time}]`,
    `카테고리: ${category}`,
    input.message ? `메모: ${input.message}` : null,
    `bookedAt: ${new Date().toISOString()}`,
  ].filter((v): v is string => Boolean(v));

  const created = await prisma.inquiry.create({
    data: {
      contactName: name,
      email,
      phone,
      title: `[예약] ${input.date} ${input.time} · ${category}`,
      description: input.message?.trim() || `${input.date} ${input.time} 상담 예약`,
      intakeSource: "booking",
      internalMemo: memoLines.join("\n"),
      consultationRequired: true,
      generatedSummary: "",
      generatedGuidance: "",
      generatedReceiptMessage: "",
      classificationReason: "",
      recommendedNextStep: "",
      intakeCategory: category,
    },
    select: { id: true },
  });

  // 응답 후 화상 상담 생성 + URL 저장 + 의뢰인 메일. 서버리스에서 함수가 얼어
  // 유실되지 않도록 after()로 스케줄하되, 요청 스코프 밖(스크립트/테스트)에서
  // 호출되면 after()가 던지므로 floating promise 로 폴백한다.
  const meetingJob = async () => {
    try {
      const { createMeeting } = await import("./video-meeting-service");
      const [h, m] = input.time.split(":").map(Number);
      const [y, mo, d] = input.date.split("-").map(Number);
      const startKst = new Date(Date.UTC(y, mo - 1, d, (h - 9 + 24) % 24, m || 0)); // KST → UTC
      const attendees = input.email ? [input.email] : [];
      const meet = await createMeeting({
        topic: `[ETHOS 상담] ${category} · ${name}`,
        startAt: startKst,
        durationMin: 30,
        attendees,
      });
      const meta = JSON.stringify({
        inquiryId: created.id,
        provider: meet.provider,
        meetingId: meet.meetingId,
        joinUrl: meet.joinUrl,
        hostUrl: meet.hostUrl ?? null,
        password: meet.password ?? null,
        date: input.date,
        time: input.time,
        createdAt: new Date().toISOString(),
      });
      await prisma.siteSetting.upsert({
        where: { key: `booking.meeting.${created.id}` },
        create: { key: `booking.meeting.${created.id}`, value: meta },
        update: { value: meta },
      });
      // Append join url to memo
      const cur = await prisma.inquiry.findUnique({
        where: { id: created.id },
        select: { internalMemo: true },
      });
      if (cur) {
        await prisma.inquiry.update({
          where: { id: created.id },
          data: {
            internalMemo: `${cur.internalMemo ?? ""}\n[MEETING provider=${meet.provider} url=${meet.joinUrl}]`.slice(0, 8000),
          },
        });
      }
      // Client email (best-effort)
      if (input.email) {
        try {
          const emailMod = await import("./email-notification-service").catch(() => null);
          const send = (emailMod as unknown as { sendMeetingInvite?: (a: { to: string; subject: string; body: string }) => Promise<unknown>; sendPlainEmail?: (a: { to: string; subject: string; body: string }) => Promise<unknown> } | null);
          const subject = `[ETHOS] 화상 상담 링크 · ${input.date} ${input.time}`;
          const body = `${name}님, 상담 예약이 확정되었습니다.\n\n일시: ${input.date} ${input.time} (KST)\n주제: ${category}\n\n화상 상담 참여 링크:\n${meet.joinUrl}\n\n감사합니다.\n행정사 ETHOS`;
          if (send?.sendMeetingInvite) {
            await send.sendMeetingInvite({ to: input.email, subject, body }).catch(() => undefined);
          } else if (send?.sendPlainEmail) {
            await send.sendPlainEmail({ to: input.email, subject, body }).catch(() => undefined);
          }
        } catch { /* best-effort */ }
      }
    } catch { /* meeting creation is best-effort */ }
  };
  try {
    const { after } = await import("next/server");
    after(meetingJob);
  } catch {
    void meetingJob();
  }

  return { ok: true, inquiryId: created.id };
}

/** Fetch meeting info stored for a booking (SiteSetting-backed). */
export async function getBookingMeeting(inquiryId: string): Promise<{
  provider: string;
  meetingId: string;
  joinUrl: string;
  hostUrl?: string | null;
  password?: string | null;
  date?: string;
  time?: string;
} | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: `booking.meeting.${inquiryId}` } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as {
      provider?: string;
      meetingId?: string;
      joinUrl?: string;
      hostUrl?: string | null;
      password?: string | null;
      date?: string;
      time?: string;
    };
    if (!parsed.joinUrl || !parsed.meetingId || !parsed.provider) return null;
    return {
      provider: parsed.provider,
      meetingId: parsed.meetingId,
      joinUrl: parsed.joinUrl,
      hostUrl: parsed.hostUrl ?? null,
      password: parsed.password ?? null,
      date: parsed.date,
      time: parsed.time,
    };
  } catch {
    return null;
  }
}
