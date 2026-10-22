import { saveBlobFile } from '../nativeFiles';
import { rpc } from './client';

export interface BackupRow {
  day: string;
  takenAt: string;
  sizeKb: number;
}

/** Admin only. Takes today's snapshot if none exists yet. */
export async function ensureDailyBackup(): Promise<void> {
  try {
    await rpc('ensure_daily_backup', {});
  } catch {
    /* 008_backup.sql not installed yet or offline: never disturb the app */
  }
}

export async function listBackups(): Promise<BackupRow[]> {
  const rows = await rpc<{ day: string; taken_at: string; size_kb: number }[]>('list_backups', {});
  return (rows ?? []).map((r) => ({ day: r.day, takenAt: r.taken_at, sizeKb: r.size_kb }));
}

export function saveJson(data: unknown, name: string): Promise<void> {
  return saveBlobFile(name, new Blob([JSON.stringify(data)], { type: 'application/json' }));
}

/** Fresh copy of everything, saved as a file on the phone/computer. */
export async function downloadFreshBackup(): Promise<void> {
  const data = await rpc('backup_now', {});
  await saveJson(data, `afs-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function downloadStoredBackup(day: string): Promise<void> {
  const data = await rpc('get_backup', { p_day: day });
  if (!data) throw new Error('empty');
  await saveJson(data, `afs-backup-${day}.json`);
}

/** Reads one stored day (without changing anything). */
export async function fetchStoredBackup(day: string): Promise<unknown> {
  const data = await rpc('get_backup', { p_day: day });
  if (!data) throw new Error('empty');
  return data;
}

/** Replaces the school data with the backup. Server side it is all-or-nothing. */
export async function restoreBackup(data: unknown): Promise<Record<string, number>> {
  return rpc<Record<string, number>>('restore_backup', { p_data: data });
}
