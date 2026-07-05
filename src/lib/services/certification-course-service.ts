/**
 * 자격증 강의 확장 — 커리큘럼·퀴즈·수료증.
 * course-service.ts를 재사용하고, 커리큘럼/진행률/수료증만 별도 SiteSetting에 저장.
 */

import { prisma } from "@/lib/prisma/client";
import { getCourse, type Course } from "./course-service";

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  passingScore: number; // 0-100
  questions: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  videos: string[]; // URLs
  quiz?: Quiz;
}

export interface Curriculum {
  id: string;
  courseId: string;
  modules: Module[];
  requiredForCertificate: boolean;
  updatedAt: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  completedModules: string[];
  quizScores: Record<string, number>; // moduleId → score
  certificateIssuedAt?: string;
  updatedAt: string;
}

function curriculumKey(courseId: string): string {
  return `certification.curriculum.${courseId}`;
}

function progressKey(userId: string, courseId: string): string {
  return `course.progress.${userId}.${courseId}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export async function getCurriculum(courseId: string): Promise<Curriculum | null> {
  return readJson<Curriculum | null>(curriculumKey(courseId), null);
}

export async function upsertCurriculum(input: Omit<Curriculum, "id" | "updatedAt"> & { id?: string }): Promise<Curriculum> {
  const now = new Date().toISOString();
  const curriculum: Curriculum = {
    id: input.id ?? `cur_${input.courseId}`,
    courseId: input.courseId,
    modules: input.modules,
    requiredForCertificate: input.requiredForCertificate,
    updatedAt: now,
  };
  await writeJson(curriculumKey(input.courseId), curriculum);
  return curriculum;
}

export async function getProgress(userId: string, courseId: string): Promise<Progress> {
  const existing = await readJson<Progress | null>(progressKey(userId, courseId), null);
  if (existing) return existing;
  return {
    userId,
    courseId,
    completedModules: [],
    quizScores: {},
    updatedAt: new Date().toISOString(),
  };
}

export async function markModuleComplete(userId: string, courseId: string, moduleId: string, quizScore?: number): Promise<Progress> {
  const p = await getProgress(userId, courseId);
  if (!p.completedModules.includes(moduleId)) p.completedModules.push(moduleId);
  if (typeof quizScore === "number") p.quizScores[moduleId] = quizScore;
  p.updatedAt = new Date().toISOString();
  await writeJson(progressKey(userId, courseId), p);
  return p;
}

export async function isCompleted(userId: string, courseId: string): Promise<{ done: boolean; percent: number; course: Course | null; curriculum: Curriculum | null }> {
  const curriculum = await getCurriculum(courseId);
  const course = await getCourse(courseId);
  const p = await getProgress(userId, courseId);
  if (!curriculum || curriculum.modules.length === 0) {
    return { done: false, percent: 0, course, curriculum };
  }
  const total = curriculum.modules.length;
  const done = curriculum.modules.filter((m) => {
    if (!p.completedModules.includes(m.id)) return false;
    if (m.quiz) {
      const score = p.quizScores[m.id] ?? 0;
      if (score < m.quiz.passingScore) return false;
    }
    return true;
  }).length;
  const percent = Math.round((done / total) * 100);
  return { done: done === total, percent, course, curriculum };
}

export async function issueCertificate(userId: string, courseId: string): Promise<Progress> {
  const p = await getProgress(userId, courseId);
  if (!p.certificateIssuedAt) {
    p.certificateIssuedAt = new Date().toISOString();
    p.updatedAt = p.certificateIssuedAt;
    await writeJson(progressKey(userId, courseId), p);
  }
  return p;
}

export function scoreQuiz(quiz: Quiz, answers: number[]): number {
  if (quiz.questions.length === 0) return 0;
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.answerIndex) correct += 1;
  });
  return Math.round((correct / quiz.questions.length) * 100);
}
