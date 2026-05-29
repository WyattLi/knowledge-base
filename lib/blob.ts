import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "notes-content";

function getBlobStore() {
  if (process.env.EDGEONE_PROJECT_ID && process.env.EDGEONE_BLOB_TOKEN) {
    return getStore({
      name: STORE_NAME,
      projectId: process.env.EDGEONE_PROJECT_ID,
      token: process.env.EDGEONE_BLOB_TOKEN,
    });
  }
  return getStore(STORE_NAME);
}

export async function blobPut(key: string, content: string): Promise<void> {
  try {
    const store = getBlobStore();
    await store.set(key, content);
  } catch {
    // Blob not available (e.g., local dev without credentials)
  }
}

export async function blobGet(key: string): Promise<string | null> {
  try {
    const store = getBlobStore();
    return await store.get(key) as string | null;
  } catch {
    return null;
  }
}

export async function blobDelete(key: string): Promise<void> {
  try {
    const store = getBlobStore();
    await store.delete(key);
  } catch {
    // Blob not available
  }
}
