import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

const TOKEN_KEY = 'afs_sb_auth_v1';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
  userId: string;
}

export class SupabaseError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
  /** Network down / server unreachable (status 0) or 5xx: worth retrying. */
  get transient(): boolean {
    return this.status === 0 || this.status >= 500 || this.status === 429;
  }
}

/** Same rule as the SQL function login_email(). */
export function loginEmail(login: string): string {
  return `${login.trim().toLowerCase().replace(/@/g, '.at.')}@afs-okara.school`;
}

export function readTokens(): AuthTokens | null {
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}
function writeTokens(t: AuthTokens | null) {
  try {
    if (t) window.localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
export function clearTokens() {
  writeTokens(null);
}

async function http(
  method: string,
  path: string,
  opts: { body?: unknown; token?: string | null; headers?: Record<string, string> } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${opts.token ?? SUPABASE_PUBLISHABLE_KEY}`,
    ...opts.headers,
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new SupabaseError(0, 'Cannot reach the server. Check the internet connection.');
  }
  if (!res.ok) {
    let msg = res.statusText;
    let code: string | undefined;
    try {
      const j = await res.json();
      msg = j.message || j.msg || j.error_description || j.error || msg;
      code = j.code || j.error_code;
    } catch {
      /* ignore */
    }
    throw new SupabaseError(res.status, String(msg), code);
  }
  return res;
}

function tokensFrom(j: { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number; user: { id: string } }): AuthTokens {
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: j.expires_at ?? Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600),
    userId: j.user.id,
  };
}

export async function signInWithPassword(login: string, password: string): Promise<AuthTokens> {
  const res = await http('POST', '/auth/v1/token?grant_type=password', {
    body: { email: loginEmail(login), password },
  });
  const t = tokensFrom(await res.json());
  writeTokens(t);
  return t;
}

let refreshing: Promise<AuthTokens | null> | null = null;

/** Returns a valid access token, refreshing when it is about to expire. */
export async function getAccessToken(): Promise<string | null> {
  const t = readTokens();
  if (!t) return null;
  if (t.expiresAt - 60 > Date.now() / 1000) return t.accessToken;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await http('POST', '/auth/v1/token?grant_type=refresh_token', {
          body: { refresh_token: t.refreshToken },
        });
        const nt = tokensFrom(await res.json());
        writeTokens(nt);
        return nt;
      } catch (e) {
        if (e instanceof SupabaseError && !e.transient) writeTokens(null);
        throw e;
      } finally {
        refreshing = null;
      }
    })();
  }
  const nt = await refreshing;
  return nt?.accessToken ?? null;
}

export async function signOutRemote(): Promise<void> {
  const t = readTokens();
  writeTokens(null);
  if (!t) return;
  try {
    await http('POST', '/auth/v1/logout', { token: t.accessToken });
  } catch {
    /* already signed out locally */
  }
}

export async function updateOwnPassword(newPassword: string): Promise<void> {
  const token = await getAccessToken();
  await http('PUT', '/auth/v1/user', { token, body: { password: newPassword } });
}

async function authed(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const token = await getAccessToken();
  return http(method, path, { token, body, headers });
}

/** Reads every row of a table/view (pages of 1000). `query` is a PostgREST query string without "?". */
export async function selectAll<T = Record<string, unknown>>(table: string, query = ''): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await authed('GET', `/rest/v1/${table}?${query}`, undefined, {
      Range: `${from}-${from + page - 1}`,
      'Range-Unit': 'items',
    });
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

export async function upsertRows(table: string, rows: Record<string, unknown>[], onConflict: string): Promise<void> {
  const chunk = 400;
  // The server requires every row of one request to carry the same keys.
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  rows = rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] === undefined ? null : r[k]])));
  for (let i = 0; i < rows.length; i += chunk) {
    await authed('POST', `/rest/v1/${table}?on_conflict=${onConflict}`, rows.slice(i, i + chunk), {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }
}

export async function patchRows(table: string, filter: string, values: Record<string, unknown>): Promise<void> {
  await authed('PATCH', `/rest/v1/${table}?${filter}`, values, { Prefer: 'return=minimal' });
}

export async function deleteWhere(table: string, filter: string): Promise<void> {
  await authed('DELETE', `/rest/v1/${table}?${filter}`, undefined, { Prefer: 'return=minimal' });
}

export async function rpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await authed('POST', `/rest/v1/rpc/${name}`, args);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
