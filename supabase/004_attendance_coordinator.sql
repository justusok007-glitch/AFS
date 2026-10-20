-- Attendance Coordinator role: marks attendance and views records for the classes
-- the Admin ticks (stored as teacher_assignments rows with attendance only, no marks).
-- Run once in the Supabase SQL editor.

do $$
declare c text;
begin
  for c in select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%VICE_PRINCIPAL%'
  loop execute format('alter table profiles drop constraint %I', c); end loop;
end $$;
alter table profiles add constraint profiles_role_check
  check (role in ('PARENT','TEACHER','PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT','ATTENDANCE_COORDINATOR','ADMIN'));

create or replace function visible_students() returns setof text
language sql stable security definer set search_path = public as $$
  select id from students where is_role('ADMIN','PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT')
  union select id from students where is_role('TEACHER','ATTENDANCE_COORDINATOR') and section_id in (select my_sections())
  union select student_id from parent_students where is_role('PARENT') and parent_id = auth.uid() $$;

create or replace function teacher_can(p_student text, p_subject text, p_kind text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(is_role('TEACHER','ATTENDANCE_COORDINATOR') and exists (
    select 1 from students s
    where s.id = p_student and (
      (p_kind = 'attendance' and exists (select 1 from sections x where x.id = s.section_id and x.class_teacher_id = auth.uid()))
      or exists (select 1 from teacher_assignments t
        where t.teacher_id = auth.uid() and t.section_id = s.section_id
          and (p_subject is null or t.subject_id is null or t.subject_id = p_subject)
          and case p_kind when 'attendance' then t.can_mark_attendance else t.can_enter_marks end))
  ), false) $$;

drop policy if exists att_sub_write on attendance_submissions;
create policy att_sub_write on attendance_submissions for all to authenticated
  using (is_role('TEACHER','ATTENDANCE_COORDINATOR') and section_id in (select my_sections()))
  with check (is_role('TEACHER','ATTENDANCE_COORDINATOR') and section_id in (select my_sections()));
