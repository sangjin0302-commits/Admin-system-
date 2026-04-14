import { getDocumentStorageDriver } from "@/lib/document-storage/config";
import { createLocalDocumentStorageAdapter } from "@/lib/document-storage/local-storage";
import { createRemoteStoragePlaceholderAdapter } from "@/lib/document-storage/remote-storage-placeholder";

function createDocumentStorageAdapter() {
  const driver = getDocumentStorageDriver();
  if (driver === "local") {
    return createLocalDocumentStorageAdapter();
  }

  return createRemoteStoragePlaceholderAdapter(driver);
}

export const documentStorage = createDocumentStorageAdapter();
