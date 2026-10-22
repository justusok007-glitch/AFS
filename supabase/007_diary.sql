-- Diary: class teachers and the vice principal post a diary (text + photos) for a section (or all sections).
-- Parents of that section, the section's teachers, principal, vice principal and admin can see it.
-- Photos live in a PRIVATE storage bucket; the app shrinks every photo to ~200 KB before upload and deletes
-- photos older than 30 days (the text stays). Run once in the Supabase SQL editor.

create table if not exists diary_entries (
  id text primary key,
  section_id text references sections(id) on delete cascade,      -- null = all sections
  date date not null,
  body text not null default '',
  image_paths text[] not null default '{}',
  author_id uuid references profiles(id) on delete set null,
  author_name text not null default '',
  created_at timestamptz not null default now());
create index if not exists diary_section_date_ix on diary_entries (section_id, date desc);
alter table diary_entries enable row level security;

create or replace function diary_can_see(p_section text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    is_role('ADMIN','PRINCIPAL','VICE_PRINCIPAL')
    or (p_section is null and app_role() is not null)
    or (is_role('TEACHER') and p_section in (select my_sections()))
    or (is_role('PARENT') and p_section in (
        select s.section_id from students s join parent_students ps on ps.student_id = s.id where ps.parent_id = auth.uid())),
    false) $$;

create or replace function diary_can_post(p_section text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    is_role('ADMIN','VICE_PRINCIPAL')
    or (is_role('TEACHER') and p_section is not null
        and exists (select 1 from sections x where x.id = p_section and x.class_teacher_id = auth.uid())),
    false) $$;

drop policy if exists diary_select on diary_entries;
create policy diary_select on diary_entries for select to authenticated using (diary_can_see(section_id));
drop policy if exists diary_insert on diary_entries;
create policy diary_insert on diary_entries for insert to authenticated
  with check (diary_can_post(section_id) and author_id = auth.uid());
drop policy if exists diary_delete on diary_entries;
create policy diary_delete on diary_entries for delete to authenticated
  using (is_role('ADMIN','VICE_PRINCIPAL') or (author_id = auth.uid() and diary_can_post(section_id)));
drop policy if exists diary_admin_update on diary_entries;
create policy diary_admin_update on diary_entries for update to authenticated
  using (is_role('ADMIN')) with check (is_role('ADMIN'));

-- private photo bucket: JPEG only, max 1 MB each
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diary', 'diary', false, 1048576, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

drop policy if exists diary_read on storage.objects;
create policy diary_read on storage.objects for select to authenticated
  using (bucket_id = 'diary' and exists (
    select 1 from diary_entries e where e.id = (storage.foldername(name))[1] and diary_can_see(e.section_id)));
drop policy if exists diary_upload on storage.objects;
create policy diary_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'diary' and is_role('ADMIN','VICE_PRINCIPAL','TEACHER'));
drop policy if exists diary_remove on storage.objects;
create policy diary_remove on storage.objects for delete to authenticated
  using (bucket_id = 'diary' and (is_role('ADMIN','VICE_PRINCIPAL') or owner_id = auth.uid()::text));
