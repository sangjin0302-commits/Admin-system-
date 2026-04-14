import { getDocumentStorageDriver } from "@/lib/document-storage/config";
import { createLocalDocumentStorageAdapter } from "@/lib/document-storage/local-storage";
import { createRemoteStoragePlaceholderAdapter } from "@/lib/document-storage/remote-storage-placeholder";
import { createS3DocumentStorageAdapter } from "@/lib/document-storage/s3-storage";

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

export const documentStorage = createDocumentStorageAdapter();
