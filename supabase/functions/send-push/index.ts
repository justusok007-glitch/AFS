// @ts-nocheck
// Supabase Edge Function "send-push": turns the messages sent by the database triggers into phone notifications.
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_SECRET, and FIREBASE_SERVICE_ACCOUNT (for the Android app; the whole JSON file) (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are added automatically).
// Deploy with "Verify JWT" switched OFF (the database calls it with the shared secret instead).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

webpush.setVapidDetails("mailto:justusok007@gmail.com", Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SECRET = Deno.env.get("PUSH_SECRET")!;

type Msg = Record<string, string | number | undefined> & { user_id: string; kind: string };

function compose(m: Msg, ur: boolean): { title: string; body: string } {
  const name = ur ? String(m.name_ur || m.name || "") : String(m.name || "");
  switch (m.kind) {
    case "absent":
      return ur ? { title: "آج غیر حاضری", body: `${name} آج اسکول سے غیر حاضر ہے۔` } : { title: "Absent today", body: `${name} was marked absent today.` };
    case "late":
      return ur ? { title: "آج تاخیر سے آمد", body: `${name} آج تاخیر سے اسکول پہنچا۔` } : { title: "Late today", body: `${name} arrived late today.` };
    case "leave":
      return ur ? { title: "رخصت درج ہوئی", body: `${name} کی آج رخصت درج کی گئی ہے۔` } : { title: "Leave marked", body: `${name} is marked on leave today.` };
    case "voucher":
      return ur
        ? { title: "نیا فیس واؤچر", body: `${name}: ${m.month} کا واؤچر، ${m.amount} روپے۔` }
        : { title: "New fee voucher", body: `${name}: voucher for ${m.month}, Rs ${m.amount}.` };
    case "result":
      return ur
        ? { title: "نتیجہ جاری ہو گیا", body: `${m.exam_ur || m.exam}: ${name} کا نتیجہ دستیاب ہے۔` }
        : { title: "Result published", body: `${m.exam}: result of ${name} is now available.` };
    case "diary":
      return ur
        ? { title: "نئی ڈائری", body: m.section_ur ? `${m.section_ur} کی ڈائری آ گئی ہے۔` : "نئی ڈائری آ گئی ہے۔" }
        : { title: "New diary", body: m.section ? `Diary for ${m.section} has been posted.` : "A new diary has been posted." };
    default:
      return ur ? { title: "ٹیسٹ اطلاع", body: "اطلاعات درست کام کر رہی ہیں۔" } : { title: "Test notification", body: "Notifications are working." };
  }
}

// ---- Android app (Firebase Cloud Messaging, HTTP v1)
const TAB: Record<string, string> = { diary: "diary", voucher: "fees", result: "results", absent: "attendance", late: "attendance", leave: "attendance" };
let fbCache: { token: string; exp: number } | null = null;
function fbAccount() {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  return raw ? JSON.parse(raw) : null;
}
const b64u = (b: ArrayBuffer | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = "";
  bytes.forEach((c) => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
async function fbAccessToken(acc: { client_email: string; private_key: string }): Promise<string> {
  if (fbCache && fbCache.exp > Date.now() + 60000) return fbCache.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64u(JSON.stringify({ iss: acc.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = acc.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64u(sig)}` }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("firebase auth failed");
  fbCache = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}
async function sendFcm(token: string, title: string, body: string, kind: string, tag: string): Promise<"ok" | "dead" | "fail"> {
  const acc = fbAccount();
  if (!acc) return "fail";
  const at = await fbAccessToken(acc);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { tab: TAB[kind] ?? "" },
        android: { priority: "HIGH", notification: { tag, channel_id: "fcm_fallback_notification_channel" } },
      },
    }),
  });
  if (res.ok) return "ok";
  if (res.status === 404 || res.status === 400) {
    const t = await res.text();
    if (t.includes("UNREGISTERED") || t.includes("INVALID_ARGUMENT")) return "dead";
  }
  return "fail";
}

Deno.serve(async (req) => {
  if (req.headers.get("x-push-secret") !== SECRET) return new Response("forbidden", { status: 403 });
  let messages: Msg[] = [];
  try {
    messages = (await req.json()).messages ?? [];
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!messages.length) return new Response("ok");

  const ids = [...new Set(messages.map((m) => m.user_id))];
  const [{ data: subs }, { data: profs }] = await Promise.all([
    db.from("push_subscriptions").select("endpoint,user_id,p256dh,auth").in("user_id", ids),
    db.from("profiles").select("id,language").in("id", ids),
  ]);
  const lang = new Map((profs ?? []).map((p: { id: string; language: string }) => [p.id, p.language]));
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    messages.flatMap((m) =>
      (subs ?? [])
        .filter((s: { user_id: string }) => s.user_id === m.user_id)
        .map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
          const ur = lang.get(m.user_id) !== "en";
          const { title, body } = compose(m, ur);
          if (s.endpoint.startsWith("fcm:")) {
            try {
              const r = await sendFcm(s.endpoint.slice(4), title, body, m.kind, `${m.kind}-${m.name ?? ""}`);
              if (r === "ok") sent++;
              else if (r === "dead") dead.push(s.endpoint);
            } catch { /* ignore */ }
            return;
          }
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify({ title, body, tag: `${m.kind}-${m.name ?? ""}`, dir: ur ? "rtl" : "ltr", lang: ur ? "ur" : "en" }),
              { TTL: 60 * 60 * 24 },
            );
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) dead.push(s.endpoint);
          }
        })
    ),
  );
  if (dead.length) await db.from("push_subscriptions").delete().in("endpoint", dead);
  return new Response(JSON.stringify({ sent, removed: dead.length }), { headers: { "Content-Type": "application/json" } });
});
