import { prisma } from "@/lib/prisma/client";
import { randomUUID } from "crypto";

export async function createSurveyToken(caseId: string, email: string): Promise<string> {
  const token = randomUUID();
  await prisma.siteSetting.create({
    data: { key: `survey.token.${token}`, value: JSON.stringify({ caseId, email, createdAt: new Date().toISOString() }) },
  });
  return token;
}

export async function getSurveyByToken(token: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key: `survey.token.${token}` } });
  if (!row?.value) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export async function processScheduledSurveys(): Promise<{ sent: number; skipped: number }> {
  // Stub: scheduled survey processing not yet implemented
  return { sent: 0, skipped: 0 };
}

export async function submitSurveyResponse(token: string, rating: number, comment: string) {
  const key = `survey.token.${token}`;
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row?.value) return false;
  const data = JSON.parse(row.value);
  data.rating = rating;
  data.comment = comment;
  data.submittedAt = new Date().toISOString();
  await prisma.siteSetting.update({ where: { key }, data: { value: JSON.stringify(data) } });
  return true;
}
