/**
 * 파일 스토리지 추상화.
 *
 * 운영 (Vercel 등 서버리스): S3 / Cloudflare R2 사용 — 로컬 파일은 휘발됨.
 * 로컬 개발: env 미설정 시 ./uploads 디스크 fallback.
 *
 * env:
 *   STORAGE_DRIVER=s3|local        (기본: s3 키 있으면 s3, 없으면 local)
 *   S3_BUCKET=...
 *   S3_REGION=auto                 (R2는 "auto")
 *   S3_ENDPOINT=...                (R2/MinIO 등 S3 호환 시. AWS면 비움)
 *   S3_ACCESS_KEY_ID=...
 *   S3_SECRET_ACCESS_KEY=...
 *   S3_PREFIX=portal-uploads       (선택, 키 prefix)
 *   PORTAL_UPLOAD_DIR=./uploads    (local fallback)
 */

import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export type PutResult = { key: string; driver: "s3" | "local" };

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

function resolveDriver(): "s3" | "local" {
  const forced = process.env.STORAGE_DRIVER?.toLowerCase();
  if (forced === "s3") return "s3";
  if (forced === "local") return "local";
  return hasS3Config() ? "s3" : "local";
}

function localDir(): string {
  const dir = process.env.PORTAL_UPLOAD_DIR ?? "./uploads";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

function s3Prefix(): string {
  const p = (process.env.S3_PREFIX ?? "portal-uploads").replace(/^\/+|\/+$/g, "");
  return p ? `${p}/` : "";
}

async function getS3Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    }
  });
}

/** 파일 저장. 반환된 key를 DB.storedPath에 기록. */
export async function putFile(
  storedName: string,
  body: Buffer,
  contentType: string
): Promise<PutResult> {
  const driver = resolveDriver();

  if (driver === "s3") {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    const key = `${s3Prefix()}${storedName}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType
      })
    );
    return { key, driver: "s3" };
  }

  const dir = localDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), body);
  return { key: storedName, driver: "local" };
}

/** 파일 읽기 (다운로드용). DB.storedPath를 key로 전달. */
export async function getFile(key: string): Promise<Buffer> {
  const driver = resolveDriver();

  if (driver === "s3") {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    // 레거시 키 (prefix 없는 로컬 파일명) 호환
    const fullKey = key.includes("/") ? key : `${s3Prefix()}${key}`;
    const res = await client.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: fullKey })
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  return readFile(path.join(localDir(), key));
}

/** 파일 삭제 (cleanup용). */
export async function deleteFile(key: string): Promise<void> {
  const driver = resolveDriver();
  if (driver === "s3") {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    const fullKey = key.includes("/") ? key : `${s3Prefix()}${key}`;
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: fullKey })
    );
    return;
  }
  await unlink(path.join(localDir(), key)).catch(() => {});
}

export function activeStorageDriver(): "s3" | "local" {
  return resolveDriver();
}
