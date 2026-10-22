import { readTokens, rpc, selectAll } from './client';

export interface ActivityRow {
  userId: string;
  day: string;
  firstSeen: string;
  lastSeen: string;
  pings: number;
}

const PING_EVERY_MS = 5 * 60 * 1000;

async function ping() {
  if (!readTokens()) return;
  try {
    await rpc('touch_activity', {});
  } catch {
    /* offline or table not installed yet: never disturb the app */
  }
}

/** Tells the server "this person is using the app" now and about every 5 minutes while the app is on screen. */
export function startHeartbeat(): () => void {
  let timer: number | null = null;
  const stopTimer = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };
  const begin = () => {
    stopTimer();
    void ping();
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void ping();
    }, PING_EVERY_MS);
  };
  const onVis = () => {
    if (document.visibilityState === 'visible') begin();
    else stopTimer();
  };
  if (document.visibilityState === 'visible') begin();
  document.addEventListener('visibilitychange', onVis);
  return () => {
    stopTimer();
    document.removeEventListener('visibilitychange', onVis);
  };
}

/** Admin: activity of the last 31 days plus the server's clock. */
export async function fetchActivity(): Promise<{ rows: ActivityRow[]; serverNow: number }> {
  void rpc('prune_activity', {}).catch(() => undefined);
  const since = new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10);
  const [raw, now] = await Promise.all([
    selectAll<Record<string, unknown>>('user_activity', `day=gte.${since}&order=day.desc`),
    rpc<string>('activity_now', {}),
  ]);
  return {
    rows: raw.map((r) => ({
      userId: String(r.user_id),
      day: String(r.day),
      firstSeen: String(r.first_seen),
      lastSeen: String(r.last_seen),
      pings: Number(r.pings) || 0,
    })),
    serverNow: new Date(now).getTime() || Date.now(),
  };
}
