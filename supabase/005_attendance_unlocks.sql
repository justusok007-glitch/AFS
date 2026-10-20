-- Admin can open attendance editing for a few minutes. Run once in the Supabase SQL editor.
create table if not exists attendance_unlocks (
  id text primary key,
  section_id text references sections(id) on delete cascade,   -- null = every section
  date date not null,
  expires_at timestamptz not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now());

alter table attendance_unlocks enable row level security;
drop policy if exists admin_all on attendance_unlocks;
create policy admin_all on attendance_unlocks for all to authenticated using (app_role() = 'ADMIN') with check (app_role() = 'ADMIN');
drop policy if exists read_all on attendance_unlocks;
create policy read_all on attendance_unlocks for select to authenticated using (app_role() is not null);
