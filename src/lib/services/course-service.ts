/**
 * Online course catalog + purchase tracking.
 * Storage: SiteSetting JSON blobs (no migration).
 *   - "courses.catalog"   → Course[]
 *   - "courses.purchases" → CoursePurchase[]
 */

import { prisma } from "@/lib/prisma/client";

export type CourseCategory = "visa" | "appeal" | "corporate" | "other";

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  videoUrl: string;
  thumbnailUrl?: string;
  category: CourseCategory;
  curriculum?: string; // multi-line
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePurchase {
  id: string;
  courseId: string;
  buyerEmail: string;
  buyerName?: string;
  orderId: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string;
}

const CATALOG_KEY = "courses.catalog";
const PURCHASES_KEY = "courses.purchases";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
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

export async function listCourses(includeUnpublished = false): Promise<Course[]> {
  const all = await readJson<Course[]>(CATALOG_KEY, []);
  return includeUnpublished ? all : all.filter((c) => c.published);
}

export async function getCourse(id: string): Promise<Course | null> {
  const all = await readJson<Course[]>(CATALOG_KEY, []);
  return all.find((c) => c.id === id) ?? null;
}

export async function upsertCourse(
  input: Partial<Course> & Pick<Course, "title" | "price">
): Promise<Course> {
  const all = await readJson<Course[]>(CATALOG_KEY, []);
  const now = new Date().toISOString();
  if (input.id) {
    const idx = all.findIndex((c) => c.id === input.id);
    if (idx >= 0) {
      const updated: Course = { ...all[idx], ...input, id: input.id, updatedAt: now };
      all[idx] = updated;
      await writeJson(CATALOG_KEY, all);
      return updated;
    }
  }
  const course: Course = {
    id: input.id ?? newId("crs"),
    title: input.title,
    description: input.description ?? "",
    price: input.price,
    videoUrl: input.videoUrl ?? "",
    thumbnailUrl: input.thumbnailUrl,
    category: (input.category as CourseCategory) ?? "other",
    curriculum: input.curriculum,
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };
  all.push(course);
  await writeJson(CATALOG_KEY, all);
  return course;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const all = await readJson<Course[]>(CATALOG_KEY, []);
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeJson(CATALOG_KEY, next);
  return true;
}

export async function listPurchases(courseId?: string): Promise<CoursePurchase[]> {
  const all = await readJson<CoursePurchase[]>(PURCHASES_KEY, []);
  return courseId ? all.filter((p) => p.courseId === courseId) : all;
}

export async function createPurchase(input: {
  courseId: string;
  buyerEmail: string;
  buyerName?: string;
  orderId: string;
  amount: number;
}): Promise<CoursePurchase> {
  const all = await readJson<CoursePurchase[]>(PURCHASES_KEY, []);
  const entry: CoursePurchase = {
    id: newId("pur"),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeJson(PURCHASES_KEY, all);
  return entry;
}

export async function markPurchasePaid(orderId: string): Promise<CoursePurchase | null> {
  const all = await readJson<CoursePurchase[]>(PURCHASES_KEY, []);
  const idx = all.findIndex((p) => p.orderId === orderId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status: "paid", paidAt: new Date().toISOString() };
  await writeJson(PURCHASES_KEY, all);
  return all[idx];
}
