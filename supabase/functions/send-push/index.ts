// @ts-nocheck
// Supabase Edge Function "send-push": turns the messages sent by the database triggers into phone notifications.
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_SECRET (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are added automatically).
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
