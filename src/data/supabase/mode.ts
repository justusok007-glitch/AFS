import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/** True when the app talks to Supabase; false keeps the old per-device demo storage. */
export const CLOUD_ENABLED: boolean = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Lets the local repositories tell the sync layer that data changed (no import cycle). */
export const cloudHooks: { onLocalSave: (() => void) | null } = { onLocalSave: null };

export function newProfileId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const h = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${h(8)}-${h(4)}-4${h(3)}-a${h(3)}-${h(12)}`;
}
