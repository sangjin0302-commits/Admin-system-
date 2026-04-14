import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import { buildDocumentStoragePath } from "@/lib/document-storage/storage-path";
import type {
  DocumentStorageAdapter,
  SaveDocumentFileInput,
  SaveDocumentFileResult
} from "@/lib/document-storage/types";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured when DOCUMENT_STORAGE_DRIVER uses remote S3 storage.`);
  }

  return value;
}

function createS3Client() {
  const region = getRequiredEnv("S3_REGION");
  const accessKeyId = getRequiredEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("S3_SECRET_ACCESS_KEY");
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || "").trim() === "true";

  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  if (!stream) {
    return Buffer.alloc(0);
  }

  if (stream instanceof Uint8Array) {
    return Buffer.from(stream);
  }

  if (typeof (stream as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (stream as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array | Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

class S3DocumentStorageAdapter implements DocumentStorageAdapter {
  private readonly bucket = getRequiredEnv("S3_BUCKET");
  private readonly client = createS3Client();

  async save(input: SaveDocumentFileInput): Promise<SaveDocumentFileResult> {
    const { storagePath, storedFilename } = buildDocumentStoragePath(input);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        Body: input.bytes,
        ContentType: input.mimeType || "application/octet-stream"
      })
    );

    return {
      storedFilename,
      storagePath,
      size: input.bytes.byteLength
    };
  }

  async remove(storagePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath
      })
    );
  }

  async read(storagePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath
      })
    );

    return streamToBuffer(response.Body);
  }

  resolveAbsolutePath(storagePath: string) {
    return `s3://${this.bucket}/${storagePath}`;
  }
}

export function createS3DocumentStorageAdapter() {
  return new S3DocumentStorageAdapter();
}
