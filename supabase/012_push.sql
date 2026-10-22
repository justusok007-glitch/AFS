-- Push notifications to parents' phones: result published, new fee voucher, new diary, absent / late / leave.
-- Run once in the Supabase SQL editor. After this, follow the 3 setup steps given with it
-- (deploy the send-push Edge Function, add its secrets, run the small push_config snippet).

create extension if not exists pg_net;

-- every phone that agreed to receive notifications (one row per phone/browser)
create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now());
create index if not exists push_subs_user_ix on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;   -- no policies: only the functions below

-- where to send and the shared secret (filled in by the setup snippet; nobody can read it from the app)
create table if not exists push_config (key text primary key, value text not null);
alter table push_config enable row level security;
insert into push_config (key, value) values ('url', 'https://szekjxewhuffqspmlbmb.supabase.co/functions/v1/send-push')
  on conflict (key) do nothing;

create or replace function register_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if app_role() is null then raise exception 'not allowed'; end if;
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function unregister_push(p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
end $$;

grant execute on function register_push(text, text, text) to authenticated;
grant execute on function unregister_push(text) to authenticated;
revoke all on function register_push(text, text, text) from public, anon;
revoke all on function unregister_push(text) from public, anon;

-- sends a list of messages (only to people who have a subscription), 40 per call so the function stays fast
create or replace function push_send(p_msgs jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  cfg_url text; cfg_secret text; msgs jsonb; n int; i int := 0; chunk jsonb;
begin
  select value into cfg_url from push_config where key = 'url';
  select value into cfg_secret from push_config where key = 'secret';
  if cfg_url is null or cfg_secret is null or p_msgs is null then return; end if;
  select coalesce(jsonb_agg(e), '[]'::jsonb) into msgs from jsonb_array_elements(p_msgs) e
    where exists (select 1 from push_subscriptions p where p.user_id = (e->>'user_id')::uuid);
  n := jsonb_array_length(msgs);
  while i < n loop
    select jsonb_agg(e) into chunk from (
      select e from jsonb_array_elements(msgs) with ordinality t(e, o) where o > i and o <= i + 40 order by o) x;
    perform net.http_post(url := cfg_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', cfg_secret),
      body := jsonb_build_object('messages', chunk));
    i := i + 40;
  end loop;
exception when others then
  null;   -- a notification problem must never block saving school data
end $$;
revoke all on function push_send(jsonb) from public, anon, authenticated;

-- fee voucher total (safe: a strange item never breaks anything)
create or replace function voucher_total(p_items jsonb) returns numeric
language plpgsql immutable as $$
declare t numeric := 0; i jsonb;
begin
  for i in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    t := t + coalesce((i->>'amount')::numeric, 0) - coalesce((i->>'waivedAmount')::numeric, 0);
  end loop;
  return t;
exception when others then
  return 0;
end $$;

-- ---------------------------------------------------------------- absent / late / leave (today only)
create or replace function trg_push_att_ins() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('user_id', ps.parent_id, 'kind', lower(n.status),
      'name', s.name, 'name_ur', s.name_ur)), '[]'::jsonb) into m
  from new_rows n join students s on s.id = n.student_id
  join parent_students ps on ps.student_id = s.id
  where n.status in ('ABSENT', 'LATE', 'LEAVE') and n.date = (now() at time zone 'Asia/Karachi')::date;
  perform push_send(m);
  return null;
exception when others then
  return null;
end $$;

create or replace function trg_push_att_upd() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('user_id', ps.parent_id, 'kind', lower(n.status),
      'name', s.name, 'name_ur', s.name_ur)), '[]'::jsonb) into m
  from new_rows n join old_rows o on o.student_id = n.student_id and o.date = n.date
  join students s on s.id = n.student_id
  join parent_students ps on ps.student_id = s.id
  where n.status in ('ABSENT', 'LATE', 'LEAVE') and n.status <> o.status
    and n.date = (now() at time zone 'Asia/Karachi')::date;
  perform push_send(m);
  return null;
exception when others then
  return null;
end $$;

drop trigger if exists push_att_ins on attendance_records;
create trigger push_att_ins after insert on attendance_records
  referencing new table as new_rows for each statement execute function trg_push_att_ins();
drop trigger if exists push_att_upd on attendance_records;
create trigger push_att_upd after update on attendance_records
  referencing old table as old_rows new table as new_rows for each statement execute function trg_push_att_upd();

-- ---------------------------------------------------------------- new fee voucher
create or replace function trg_push_voucher() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('user_id', ps.parent_id, 'kind', 'voucher',
      'name', s.name, 'name_ur', s.name_ur, 'month', v.billing_month, 'amount', voucher_total(v.items))), '[]'::jsonb) into m
  from new_rows v join students s on s.id = v.student_id
  join parent_students ps on ps.student_id = s.id
  where v.status <> 'PAID';
  perform push_send(m);
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists push_voucher on fee_vouchers;
create trigger push_voucher after insert on fee_vouchers
  referencing new table as new_rows for each statement execute function trg_push_voucher();

-- ---------------------------------------------------------------- result published
create or replace function trg_push_result() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('user_id', ps.parent_id, 'kind', 'result',
      'name', s.name, 'name_ur', s.name_ur, 'exam', n.name_en, 'exam_ur', n.name_ur)), '[]'::jsonb) into m
  from new_rows n join old_rows o on o.id = n.id
  join (select distinct exam_id, class_id from exam_subjects) x on x.exam_id = n.id
  join sections sec on sec.class_id = x.class_id
  join students s on s.section_id = sec.id and s.status = 'ACTIVE'
  join parent_students ps on ps.student_id = s.id
  where n.status = 'PUBLISHED' and o.status <> 'PUBLISHED';
  perform push_send(m);
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists push_result on exams;
create trigger push_result after update on exams
  referencing old table as old_rows new table as new_rows for each statement execute function trg_push_result();

-- ---------------------------------------------------------------- new diary
create or replace function trg_push_diary() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('user_id', r.parent_id, 'kind', 'diary',
      'section', r.sec_en, 'section_ur', r.sec_ur)), '[]'::jsonb) into m
  from (
    select distinct on (n.id, ps.parent_id) ps.parent_id,
      case when n.section_id is null then '' else c.name_en || '-' || sec.name end as sec_en,
      case when n.section_id is null then '' else c.name_ur || '-' || sec.name end as sec_ur
    from new_rows n
    join students s on s.status = 'ACTIVE' and (n.section_id is null or s.section_id = n.section_id)
    join sections sec on sec.id = s.section_id
    join classes c on c.id = sec.class_id
    join parent_students ps on ps.student_id = s.id
  ) r;
  perform push_send(m);
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists push_diary on diary_entries;
create trigger push_diary after insert on diary_entries
  referencing new table as new_rows for each statement execute function trg_push_diary();

-- ---------------------------------------------------------------- test button (Settings > Send test notification)
create or replace function push_test() returns void
language plpgsql security definer set search_path = public as $$
begin
  if app_role() is null then raise exception 'not allowed'; end if;
  perform push_send(jsonb_build_array(jsonb_build_object('user_id', auth.uid(), 'kind', 'test')));
end $$;
grant execute on function push_test() to authenticated;
revoke all on function push_test() from public, anon;
