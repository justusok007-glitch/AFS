import { rpc, readTokens } from './client';

/** Public half of the notification key (safe to keep in the app). */
const VAPID_PUBLIC_KEY = 'BDM5a_9mX5UdJ9IdtY3WeOrBOoYND-uqIKl5320wcRNs6rX1OeoOgSIT0MOwo9GDFkCUlXxjlYts3n7mY-t7w7c';

export const PUSH_SUPPORTED =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function pushPermission(): NotificationPermission | 'unsupported' {
  return PUSH_SUPPORTED ? Notification.permission : 'unsupported';
}

function keyBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
const b64url = (buf: ArrayBuffer | null) =>
  buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '';

let registration: Promise<ServiceWorkerRegistration> | null = null;
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> | null {
  if (!PUSH_SUPPORTED) return null;
  registration ??= navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(() => navigator.serviceWorker.ready);
  return registration;
}

async function currentSubscription(create: boolean): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  if (!reg) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing || !create) return existing;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) as unknown as BufferSource });
}

async function saveToServer(sub: PushSubscription): Promise<void> {
  await rpc('register_push', {
    p_endpoint: sub.endpoint,
    p_p256dh: b64url(sub.getKey('p256dh')),
    p_auth: b64url(sub.getKey('auth')),
  });
}

/** Must be called from a button tap (the browser asks for permission). */
export async function enablePush(): Promise<'ok' | 'denied' | 'unsupported' | 'failed'> {
  if (!PUSH_SUPPORTED) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const sub = await currentSubscription(true);
    if (!sub) return 'failed';
    await saveToServer(sub);
    return 'ok';
  } catch {
    return 'failed';
  }
}

/** After sign-in: if this phone already agreed, link it to the signed-in person (a shared phone moves to the new user). */
export async function syncPushRegistration(): Promise<void> {
  if (!PUSH_SUPPORTED || !readTokens()) return;
  try {
    if (Notification.permission !== 'granted') {
      void registerServiceWorker();
      return;
    }
    const sub = await currentSubscription(true);
    if (sub) await saveToServer(sub);
  } catch {
    /* never disturb the app */
  }
}

/** On sign-out: this phone stops receiving the signed-out person's notifications. */
export async function forgetPushOnLogout(): Promise<void> {
  if (!PUSH_SUPPORTED) return;
  try {
    const sub = await currentSubscription(false);
    if (sub) await rpc('unregister_push', { p_endpoint: sub.endpoint });
  } catch {
    /* ignore */
  }
}

/** Turns notifications off for this phone. */
export async function disablePush(): Promise<void> {
  try {
    const sub = await currentSubscription(false);
    if (sub) {
      await rpc('unregister_push', { p_endpoint: sub.endpoint }).catch(() => undefined);
      await sub.unsubscribe();
    }
  } catch {
    /* ignore */
  }
}

export async function sendTestPush(): Promise<boolean> {
  try {
    await rpc('push_test', {});
    return true;
  } catch {
    return false;
  }
}
