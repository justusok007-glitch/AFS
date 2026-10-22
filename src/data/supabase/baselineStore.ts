import type { LocalDatabaseSnapshot } from '../seed/DemoSeedData';

/**
 * Keeps a copy of "what the server had when we last synced" on the phone (IndexedDB, large space).
 * After the app is closed with unsent changes, the next start compares the saved local data with this copy
 * and sends only the real differences, instead of replacing the local data with the server's.
 */
const DB = 'afs_sync';
const STORE = 'baseline';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBaseline(userId: string, snap: LocalDatabaseSnapshot): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ userId, snap }, 'main');
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* private mode or storage full: the app still works, it just cannot recover unsent edits */
  }
}

export async function loadBaseline(userId: string): Promise<LocalDatabaseSnapshot | null> {
  try {
    const db = await open();
    const v = await new Promise<{ userId: string; snap: LocalDatabaseSnapshot } | undefined>((res, rej) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get('main');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    db.close();
    return v && v.userId === userId ? v.snap : null;
  } catch {
    return null;
  }
}

export async function clearBaseline(): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((res) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete('main');
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
    db.close();
  } catch {
    /* ignore */
  }
}
