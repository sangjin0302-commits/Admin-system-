import { getDocumentStorageDriver } from "@/lib/document-storage/config";
import { createLocalDocumentStorageAdapter } from "@/lib/document-storage/local-storage";
import { createRemoteStoragePlaceholderAdapter } from "@/lib/document-storage/remote-storage-placeholder";
import { createS3DocumentStorageAdapter } from "@/lib/document-storage/s3-storage";
import type { DocumentStorageAdapter } from "@/lib/document-storage/types";

function createDocumentStorageAdapter() {
  const driver = getDocumentStorageDriver();
  if (driver === "local") {
    return createLocalDocumentStorageAdapter();
  }

  if (driver === "s3" || driver === "r2") {
    return createS3DocumentStorageAdapter();
  }

  return createRemoteStoragePlaceholderAdapter(driver);
}

let documentStorageInstance: DocumentStorageAdapter | null = null;

function getDocumentStorageAdapter() {
  if (!documentStorageInstance) {
    documentStorageInstance = createDocumentStorageAdapter();
  }

  return documentStorageInstance;
}

export const documentStorage: DocumentStorageAdapter = {
  save(input) {
    return getDocumentStorageAdapter().save(input);
  },
  remove(storagePath) {
    return getDocumentStorageAdapter().remove(storagePath);
  },
  read(storagePath) {
    return getDocumentStorageAdapter().read(storagePath);
  },
  resolveAbsolutePath(storagePath) {
    return getDocumentStorageAdapter().resolveAbsolutePath(storagePath);
  }
};
