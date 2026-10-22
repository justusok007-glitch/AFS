-- Backup: one snapshot of all school data per day, kept for 7 days inside Supabase.
-- The admin can also download a fresh copy (JSON file) from the app. Run once in the SQL editor.

create table if not exists backups (
  day date primary key,
  data jsonb not null,
  created_at timestamptz not null default now());
alter table backups enable row level security;   -- no policies: only the functions below can touch it

create or replace function _make_backup() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t text;
  result jsonb := '{}'::jsonb;
  part jsonb;
begin
  foreach t in array array[
    'campuses','academic_years','classes','subjects','class_subjects','profiles','sections','teacher_assignments',
    'students','parent_students','grading_scale','school_settings','holidays','attendance_records',
    'attendance_submissions','attendance_unlocks','fee_heads','class_fee_structures','student_concessions',
    'fee_vouchers','fee_payments','payment_allocations','exams','exam_subjects','marks','mark_submissions',
    'conversations','messages','notices','notifications','audit_logs','diary_entries']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x', t) into part;
      result := result || jsonb_build_object(t, part);
    end if;
  end loop;
  result := jsonb_build_object('app', 'AFS', 'taken_at', now(), 'tables', result);
  insert into backups(day, data) values ((now() at time zone 'Asia/Karachi')::date, result)
    on conflict (day) do update set data = excluded.data, created_at = now();
  delete from backups where day < (now() at time zone 'Asia/Karachi')::date - 6;
  return result;
end $$;
revoke all on function _make_backup() from public, anon, authenticated;

-- admin: take today's snapshot if it does not exist yet (the app calls this when the admin opens it)
create or replace function ensure_daily_backup() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_role('ADMIN') then raise exception 'not allowed'; end if;
  if exists (select 1 from backups where day = (now() at time zone 'Asia/Karachi')::date) then return false; end if;
  perform _make_backup();
  return true;
end $$;

-- admin: list stored days
create or replace function list_backups() returns table(day date, taken_at timestamptz, size_kb int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_role('ADMIN') then raise exception 'not allowed'; end if;
  return query select b.day, b.created_at, (pg_column_size(b.data) / 1024)::int from backups b order by b.day desc;
end $$;

-- admin: fresh copy right now (also refreshes today's snapshot)
create or replace function backup_now() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not is_role('ADMIN') then raise exception 'not allowed'; end if;
  return _make_backup();
end $$;

-- admin: one stored day
create or replace function get_backup(p_day date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_role('ADMIN') then raise exception 'not allowed'; end if;
  select data into r from backups where day = p_day;
  return r;
end $$;

-- optional: also run every night at 21:00 UTC (02:00 Pakistan) if pg_cron is switched on in your project
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule('afs_nightly_backup') where exists (select 1 from cron.job where jobname = 'afs_nightly_backup');
  perform cron.schedule('afs_nightly_backup', '0 21 * * *', 'select public._make_backup()');
exception when others then
  raise notice 'pg_cron not available; the app will take the daily snapshot when the admin opens it.';
end $$;
