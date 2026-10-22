import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import { deleteWhere, getAccessToken, insertRows, patchRows, selectAll, SupabaseError } from './client';

export const DIARY_PHOTO_DAYS = 30;
export const DIARY_MAX_PHOTOS = 3;

export interface DiaryEntry {
  id: string;
  sectionId: string | null; // null = all sections
  date: string;
  body: string;
  imagePaths: string[];
  authorId: string | null;
  authorName: string;
  createdAt: string;
}

const fromRow = (r: Record<string, unknown>): DiaryEntry => ({
  id: String(r.id),
  sectionId: (r.section_id as string | null) ?? null,
  date: String(r.date),
  body: String(r.body ?? ''),
  imagePaths: Array.isArray(r.image_paths) ? (r.image_paths as string[]) : [],
  authorId: (r.author_id as string | null) ?? null,
  authorName: String(r.author_name ?? ''),
  createdAt: String(r.created_at),
});

/** Shrinks a photo to about 1280 px wide JPEG (target 150 to 350 KB) so the free storage lasts. */
export async function compressPhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot process the photo on this device.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  let q = 0.72;
  for (;;) {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));
    if (!blob) throw new Error('Cannot process the photo on this device.');
    if (blob.size <= 350 * 1024 || q <= 0.4) return blob;
    q -= 0.1;
  }
}

async function storageFetch(method: string, path: string, body?: BodyInit, headers: Record<string, string> = {}) {
  const token = await getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
      method,
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token ?? SUPABASE_PUBLISHABLE_KEY}`, ...headers },
      body,
    });
  } catch {
    throw new SupabaseError(0, 'Cannot reach the server. Check the internet connection.');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.message || j.error || msg;
    } catch {
      /* ignore */
    }
    throw new SupabaseError(res.status, String(msg));
  }
  return res;
}

export async function listDiary(limit = 60): Promise<DiaryEntry[]> {
  const rows = await selectAll<Record<string, unknown>>('diary_entries', `order=date.desc,created_at.desc&limit=${limit}`);
  return rows.map(fromRow);
}

export async function postDiary(input: {
  sectionId: string | null;
  date: string;
  body: string;
  photos: Blob[];
  authorId: string;
  authorName: string;
}): Promise<void> {
  const id = `dy_${crypto.randomUUID()}`;
  const paths: string[] = [];
  try {
    for (let i = 0; i < input.photos.length; i++) {
      const path = `${id}/${i + 1}.jpg`;
      await storageFetch('POST', `/object/diary/${path}`, input.photos[i], { 'Content-Type': 'image/jpeg' });
      paths.push(path);
    }
    await insertRows('diary_entries', [{
      id,
      section_id: input.sectionId,
      date: input.date,
      body: input.body,
      image_paths: paths,
      author_id: input.authorId,
      author_name: input.authorName,
    }]);
  } catch (e) {
    if (paths.length) void removePhotos(paths).catch(() => undefined);
    throw e;
  }
}

export async function removePhotos(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await storageFetch('DELETE', '/object/diary', JSON.stringify({ prefixes: paths }), { 'Content-Type': 'application/json' });
}

export async function deleteDiary(entry: DiaryEntry): Promise<void> {
  await removePhotos(entry.imagePaths).catch(() => undefined);
  await deleteWhere('diary_entries', `id=eq.${encodeURIComponent(entry.id)}`);
}

const memory = new Map<string, string>();

/** Loads one private photo (cached on the phone so it is downloaded only once). */
export async function diaryPhotoUrl(path: string): Promise<string> {
  const hit = memory.get(path);
  if (hit) return hit;
  const key = new Request(`${window.location.origin}/__diary/${path}`);
  let blob: Blob | null = null;
  try {
    const cache = await caches.open('afs-diary-v1');
    const cached = await cache.match(key);
    if (cached) blob = await cached.blob();
    if (!blob) {
      const res = await storageFetch('GET', `/object/authenticated/diary/${path}`);
      blob = await res.clone().blob();
      await cache.put(key, new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }));
    }
  } catch (e) {
    if (e instanceof SupabaseError) throw e;
    if (!blob) {
      const res = await storageFetch('GET', `/object/authenticated/diary/${path}`);
      blob = await res.blob();
    }
  }
  const url = URL.createObjectURL(blob);
  memory.set(path, url);
  return url;
}

/** Admin: deletes photos older than DIARY_PHOTO_DAYS (the entry text stays). Cheap; runs at most once a day. */
export async function purgeOldDiaryPhotos(): Promise<number> {
  const KEY = 'afs_diary_purge_day';
  const todayKey = new Date().toISOString().slice(0, 10);
  try {
    if (window.localStorage.getItem(KEY) === todayKey) return 0;
  } catch {
    /* ignore */
  }
  const cutoff = new Date(Date.now() - DIARY_PHOTO_DAYS * 86400000).toISOString();
  const rows = await selectAll<Record<string, unknown>>('diary_entries', `created_at=lt.${encodeURIComponent(cutoff)}&image_paths=neq.%7B%7D`);
  let n = 0;
  for (const r of rows) {
    const e = fromRow(r);
    if (!e.imagePaths.length) continue;
    await removePhotos(e.imagePaths);
    await patchRows('diary_entries', `id=eq.${encodeURIComponent(e.id)}`, { image_paths: [] });
    n += e.imagePaths.length;
  }
  try {
    window.localStorage.setItem(KEY, todayKey);
  } catch {
    /* ignore */
  }
  return n;
}
