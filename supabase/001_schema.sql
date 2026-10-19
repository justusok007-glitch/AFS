-- Al Furqan School Okara - database schema, login mapping and permission rules.
-- Run this whole file once in Supabase: SQL Editor -> New query -> paste -> Run.
-- It is safe to re-run (everything is "if not exists" / "create or replace").

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables
create table if not exists campuses (
  id text primary key, code text not null check (code in ('B','G')),
  name_en text not null, name_ur text not null);

create table if not exists academic_years (
  id text primary key, name text not null, start_date date not null,
  end_date date not null, is_current boolean not null default false);

create table if not exists classes (
  id text primary key, campus_id text not null references campuses(id),
  name_en text not null, name_ur text not null, sort_order int not null default 0);

create table if not exists subjects (
  id text primary key, name_en text not null, name_ur text not null);

create table if not exists class_subjects (
  class_id text not null references classes(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  primary key (class_id, subject_id));

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text not null,
  role text not null check (role in ('PARENT','TEACHER','PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT','ADMIN')),
  full_name text not null, full_name_ur text not null default '',
  phone text not null default '', campus_id text references campuses(id),
  language text not null default 'ur', is_active boolean not null default true,
  created_at timestamptz not null default now());
create unique index if not exists profiles_login_uq on profiles (upper(login_id));

create table if not exists sections (
  id text primary key, class_id text not null references classes(id) on delete cascade,
  name text not null, class_teacher_id uuid references profiles(id) on delete set null);

create table if not exists teacher_assignments (
  id text primary key, teacher_id uuid not null references profiles(id) on delete cascade,
  section_id text not null references sections(id) on delete cascade,
  subject_id text references subjects(id) on delete cascade,
  can_mark_attendance boolean not null default true,
  can_enter_marks boolean not null default true);

create table if not exists students (
  id text primary key, admission_no text not null, name text not null,
  name_ur text not null default '', father_name text not null default '',
  gender text not null check (gender in ('MALE','FEMALE')),
  date_of_birth date, campus_id text not null references campuses(id),
  section_id text not null references sections(id), roll_no int not null default 0,
  admission_date date not null, status text not null default 'ACTIVE' check (status in ('ACTIVE','LEFT')),
  guardian_phone text not null default '', guardian_phone2 text,
  unique (campus_id, admission_no));
create index if not exists students_section_ix on students (section_id);

create table if not exists parent_students (
  parent_id uuid not null references profiles(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  relation text not null default 'FATHER' check (relation in ('FATHER','MOTHER','GUARDIAN')),
  primary key (parent_id, student_id));

create table if not exists grading_scale (
  min_percent numeric primary key, grade text not null, remarks_en text, remarks_ur text);

create table if not exists school_settings (
  id int primary key default 1 check (id = 1),
  name_en text not null default 'Al Furqan School Okara', name_ur text not null default '',
  office_phones jsonb not null default '[]', address text not null default '',
  attendance_lock_time text not null default '23:59',
  weekly_off_days jsonb not null default '["SUNDAY"]', show_class_position boolean not null default true);

create table if not exists holidays (
  id text primary key, title_en text not null, title_ur text not null default '',
  date date not null, campus_id text references campuses(id));

create table if not exists attendance_records (
  student_id text not null references students(id) on delete cascade,
  date date not null, section_id text not null,
  status text not null check (status in ('PRESENT','ABSENT','LEAVE','LATE')),
  remarks text, marked_by text not null,
  primary key (student_id, date));
create index if not exists attendance_section_date_ix on attendance_records (section_id, date);

create table if not exists attendance_submissions (
  section_id text not null, date date not null, submitted_by text not null,
  submitted_at timestamptz not null default now(), primary key (section_id, date));

create table if not exists fee_heads (
  id text primary key, code text not null, name_en text not null, name_ur text not null default '',
  category text not null, priority int not null default 0);

create table if not exists class_fee_structures (
  class_id text not null references classes(id) on delete cascade,
  fee_head_id text not null references fee_heads(id) on delete cascade,
  amount bigint not null, charge_month int, primary key (class_id, fee_head_id));

create table if not exists student_concessions (
  student_id text not null references students(id) on delete cascade,
  fee_head_id text not null references fee_heads(id) on delete cascade,
  type text not null, value bigint not null, reason text not null default '',
  primary key (student_id, fee_head_id));

create table if not exists fee_vouchers (
  id text primary key, voucher_no text not null, student_id text not null references students(id) on delete cascade,
  campus_id text not null, billing_month text not null, issue_date date not null, due_date date not null,
  items jsonb not null default '[]', status text not null check (status in ('UNPAID','PARTIAL','PAID')));
create index if not exists fee_vouchers_student_ix on fee_vouchers (student_id);

create table if not exists fee_payments (
  id text primary key, receipt_no text not null, student_id text not null references students(id) on delete cascade,
  amount bigint not null, paid_on date not null, method text not null, received_by text not null default '',
  is_void boolean not null default false, void_reason text, reference text, remarks text);
create index if not exists fee_payments_student_ix on fee_payments (student_id);

create table if not exists payment_allocations (
  id text primary key, payment_id text not null references fee_payments(id) on delete cascade,
  voucher_id text not null references fee_vouchers(id) on delete cascade,
  fee_head_id text, allocated_amount bigint not null);

create table if not exists exams (
  id text primary key, name_en text not null, name_ur text not null default '',
  type text not null, status text not null default 'DRAFT', campus_id text references campuses(id),
  start_date date, end_date date);

create table if not exists exam_subjects (
  exam_id text not null references exams(id) on delete cascade,
  class_id text not null references classes(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  total_marks numeric not null, pass_marks numeric not null,
  primary key (exam_id, class_id, subject_id));

create table if not exists marks (
  exam_id text not null references exams(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  obtained numeric not null default 0, is_absent boolean not null default false,
  primary key (exam_id, student_id, subject_id));

create table if not exists mark_submissions (
  exam_id text not null references exams(id) on delete cascade,
  section_id text not null, subject_id text not null,
  submitted_by text not null, submitted_at timestamptz not null default now(),
  primary key (exam_id, section_id, subject_id));

create table if not exists conversations (
  id text primary key, student_id text not null references students(id) on delete cascade,
  parent_id text not null, teacher_id text not null, last_message_at timestamptz not null default now());

create table if not exists messages (
  id text primary key, conversation_id text not null references conversations(id) on delete cascade,
  sender_id text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz);

create table if not exists notices (
  id text primary key, title text not null, body text not null default '',
  audience text not null, audience_id text, created_by text not null,
  created_at timestamptz not null default now(), expires_at timestamptz);

create table if not exists notifications (
  id text primary key, user_id text not null, type text not null, title text not null,
  body text not null default '', title_ur text, body_ur text,
  created_at timestamptz not null default now(), read_at timestamptz);
create index if not exists notifications_user_ix on notifications (user_id);

create table if not exists audit_logs (
  id text primary key, action text not null, table_name text not null, record_id text not null,
  old_value text, new_value text, reason text not null default '', changed_by text not null,
  changed_at timestamptz not null default now());

-- ---------------------------------------------------------------- helpers
-- Who is calling? (security definer so these can read profiles without recursion)
create or replace function app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and is_active $$;

create or replace function is_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(app_role() = any(roles), false) $$;

-- sections a teacher may work with (assigned or class teacher)
create or replace function my_sections() returns setof text
language sql stable security definer set search_path = public as $$
  select section_id from teacher_assignments where teacher_id = auth.uid()
  union select id from sections where class_teacher_id = auth.uid() $$;

create or replace function my_children() returns setof text
language sql stable security definer set search_path = public as
$$ select student_id from parent_students where parent_id = auth.uid() $$;

-- every student the caller may see
create or replace function visible_students() returns setof text
language sql stable security definer set search_path = public as $$
  select id from students where is_role('ADMIN','PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT')
  union select id from students where is_role('TEACHER') and section_id in (select my_sections())
  union select student_id from parent_students where is_role('PARENT') and parent_id = auth.uid() $$;

create or replace function teacher_can(p_student text, p_subject text, p_kind text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(is_role('TEACHER') and exists (
    select 1 from students s
    where s.id = p_student and (
      (p_kind = 'attendance' and exists (select 1 from sections x where x.id = s.section_id and x.class_teacher_id = auth.uid()))
      or exists (select 1 from teacher_assignments t
        where t.teacher_id = auth.uid() and t.section_id = s.section_id
          and (p_subject is null or t.subject_id is null or t.subject_id = p_subject)
          and case p_kind when 'attendance' then t.can_mark_attendance else t.can_enter_marks end))
  ), false) $$;

-- Login names are turned into a hidden email so people still type just their user name.
create or replace function login_email(p_login text) returns text
language sql immutable as
$$ select lower(replace(trim(p_login), '@', '.at.')) || '@afs-okara.school' $$;

-- ---------------------------------------------------------------- row level security
do $$
declare t text;
begin
  foreach t in array array['campuses','academic_years','classes','subjects','class_subjects','profiles','sections',
    'teacher_assignments','students','parent_students','grading_scale','school_settings','holidays',
    'attendance_records','attendance_submissions','fee_heads','class_fee_structures','student_concessions',
    'fee_vouchers','fee_payments','payment_allocations','exams','exam_subjects','marks','mark_submissions',
    'conversations','messages','notices','notifications','audit_logs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists admin_all on %I', t);
    execute format('create policy admin_all on %I for all to authenticated using (app_role() = ''ADMIN'') with check (app_role() = ''ADMIN'')', t);
  end loop;
end $$;

-- reference data: everyone signed in may read
do $$
declare t text;
begin
  foreach t in array array['campuses','academic_years','classes','subjects','class_subjects','sections',
    'teacher_assignments','grading_scale','school_settings','holidays','fee_heads','class_fee_structures','exams','exam_subjects'] loop
    execute format('drop policy if exists read_all on %I', t);
    execute format('create policy read_all on %I for select to authenticated using (app_role() is not null)', t);
  end loop;
end $$;

-- profiles: own row, all staff accounts for everyone, parent accounts for staff and the child's teachers
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated using (
  id = auth.uid()
  or (app_role() is not null and role <> 'PARENT')
  or is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT')
  or (is_role('TEACHER') and exists (select 1 from parent_students ps where ps.parent_id = profiles.id and ps.student_id in (select visible_students()))));
drop policy if exists profiles_self_lang on profiles;
create policy profiles_self_lang on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = app_role());

-- students and links
drop policy if exists students_read on students;
create policy students_read on students for select to authenticated using (id in (select visible_students()));
drop policy if exists parent_students_read on parent_students;
create policy parent_students_read on parent_students for select to authenticated using (student_id in (select visible_students()));

-- attendance
drop policy if exists att_read on attendance_records;
create policy att_read on attendance_records for select to authenticated using (student_id in (select visible_students()));
drop policy if exists att_write on attendance_records;
create policy att_write on attendance_records for all to authenticated
  using (teacher_can(student_id, null, 'attendance')) with check (teacher_can(student_id, null, 'attendance'));
drop policy if exists att_sub_read on attendance_submissions;
create policy att_sub_read on attendance_submissions for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT') or section_id in (select my_sections()));
drop policy if exists att_sub_write on attendance_submissions;
create policy att_sub_write on attendance_submissions for all to authenticated
  using (is_role('TEACHER') and section_id in (select my_sections())) with check (is_role('TEACHER') and section_id in (select my_sections()));
drop policy if exists att_staff_read on attendance_records;
create policy att_staff_read on attendance_records for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT'));

-- concessions & vouchers & payments: money staff and the child's parent
drop policy if exists fee_staff on fee_vouchers;
create policy fee_staff on fee_vouchers for all to authenticated
  using (is_role('ACCOUNTANT')) with check (is_role('ACCOUNTANT'));
drop policy if exists fee_read on fee_vouchers;
create policy fee_read on fee_vouchers for select to authenticated
  using (is_role('PRINCIPAL','VICE_PRINCIPAL') or student_id in (select my_children()));
drop policy if exists pay_staff on fee_payments;
create policy pay_staff on fee_payments for all to authenticated using (is_role('ACCOUNTANT')) with check (is_role('ACCOUNTANT'));
drop policy if exists pay_read on fee_payments;
create policy pay_read on fee_payments for select to authenticated
  using (is_role('PRINCIPAL','VICE_PRINCIPAL') or student_id in (select my_children()));
drop policy if exists alloc_staff on payment_allocations;
create policy alloc_staff on payment_allocations for all to authenticated using (is_role('ACCOUNTANT')) with check (is_role('ACCOUNTANT'));
drop policy if exists alloc_read on payment_allocations;
create policy alloc_read on payment_allocations for select to authenticated
  using (is_role('PRINCIPAL','VICE_PRINCIPAL') or payment_id in (select id from fee_payments where student_id in (select my_children())));
drop policy if exists conc_staff on student_concessions;
create policy conc_staff on student_concessions for all to authenticated using (is_role('ACCOUNTANT')) with check (is_role('ACCOUNTANT'));
drop policy if exists conc_read on student_concessions;
create policy conc_read on student_concessions for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL') or student_id in (select my_children()));
drop policy if exists fee_struct_acc on class_fee_structures;
create policy fee_struct_acc on class_fee_structures for all to authenticated using (is_role('ACCOUNTANT')) with check (is_role('ACCOUNTANT'));

-- results: published exams only for parents; teachers enter marks for their sections
drop policy if exists marks_read on marks;
create policy marks_read on marks for select to authenticated using (
  is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT')
  or (is_role('TEACHER') and student_id in (select visible_students()))
  or (is_role('PARENT') and student_id in (select my_children())
      and exists (select 1 from exams e where e.id = marks.exam_id and e.status = 'PUBLISHED')));
drop policy if exists marks_teacher on marks;
create policy marks_teacher on marks for all to authenticated
  using (teacher_can(student_id, subject_id, 'marks')) with check (teacher_can(student_id, subject_id, 'marks'));
drop policy if exists msub_read on mark_submissions;
create policy msub_read on mark_submissions for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT') or section_id in (select my_sections()));
drop policy if exists msub_write on mark_submissions;
create policy msub_write on mark_submissions for all to authenticated
  using (is_role('TEACHER') and section_id in (select my_sections())) with check (is_role('TEACHER') and section_id in (select my_sections()));
drop policy if exists exams_principal on exams;
create policy exams_principal on exams for all to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL')) with check (is_role('PRINCIPAL','VICE_PRINCIPAL'));

-- messages: only the two people in the conversation, plus read-only oversight for admin/principal/vice principal
drop policy if exists conv_part on conversations;
create policy conv_part on conversations for all to authenticated
  using (auth.uid()::text in (parent_id, teacher_id)) with check (auth.uid()::text in (parent_id, teacher_id));
drop policy if exists conv_oversight on conversations;
create policy conv_oversight on conversations for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL'));
drop policy if exists msg_part on messages;
create policy msg_part on messages for all to authenticated
  using (conversation_id in (select id from conversations where auth.uid()::text in (parent_id, teacher_id)))
  with check (conversation_id in (select id from conversations where auth.uid()::text in (parent_id, teacher_id)) and sender_id = auth.uid()::text);
drop policy if exists msg_oversight on messages;
create policy msg_oversight on messages for select to authenticated using (is_role('PRINCIPAL','VICE_PRINCIPAL'));

-- notices: everyone reads, principal/vice principal/teachers post
drop policy if exists notices_read on notices;
create policy notices_read on notices for select to authenticated using (app_role() is not null);
drop policy if exists notices_write on notices;
create policy notices_write on notices for all to authenticated
  using (is_role('PRINCIPAL','VICE_PRINCIPAL') or (is_role('TEACHER') and created_by = auth.uid()::text))
  with check (is_role('PRINCIPAL','VICE_PRINCIPAL') or (is_role('TEACHER') and created_by = auth.uid()::text));

-- notifications: yours only; anyone signed in may notify (the app does this when it sends messages/notices)
drop policy if exists notif_own on notifications;
create policy notif_own on notifications for select to authenticated using (user_id = auth.uid()::text);
drop policy if exists notif_update on notifications;
create policy notif_update on notifications for update to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
drop policy if exists notif_insert on notifications;
create policy notif_insert on notifications for insert to authenticated with check (app_role() is not null);

-- audit log: admin reads (principal too); anyone signed in may add their own entries
drop policy if exists audit_read on audit_logs;
create policy audit_read on audit_logs for select to authenticated using (is_role('PRINCIPAL'));
drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs for insert to authenticated with check (changed_by = auth.uid()::text);

-- ---------------------------------------------------------------- account management (admin only)
create or replace function admin_create_account(
  p_login text, p_password text, p_role text, p_full_name text, p_full_name_ur text,
  p_phone text, p_campus text, p_language text default 'ur')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := gen_random_uuid(); v_email text := login_email(p_login);
begin
  if auth.uid() is not null and app_role() <> 'ADMIN' then raise exception 'Only the Admin can create accounts'; end if;
  if exists (select 1 from profiles where upper(login_id) = upper(trim(p_login))) then
    raise exception 'User name % is already taken', p_login; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'Password must be at least 4 characters'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      crypt(p_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', v_id::text, now(), now(), now());
  insert into profiles (id, login_id, role, full_name, full_name_ur, phone, campus_id, language)
    values (v_id, upper(trim(p_login)), p_role, p_full_name, coalesce(p_full_name_ur,''), coalesce(p_phone,''),
      nullif(p_campus,''), p_language);
  return v_id;
end $$;

create or replace function admin_set_password(p_profile uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and app_role() <> 'ADMIN' then raise exception 'Only the Admin can reset passwords'; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'Password must be at least 4 characters'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_profile;
end $$;

create or replace function admin_set_login(p_profile uuid, p_login text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and app_role() <> 'ADMIN' then raise exception 'Only the Admin can change user names'; end if;
  if exists (select 1 from profiles where upper(login_id) = upper(trim(p_login)) and id <> p_profile) then
    raise exception 'User name % is already taken', p_login; end if;
  update profiles set login_id = upper(trim(p_login)) where id = p_profile;
  update auth.users set email = login_email(p_login), updated_at = now() where id = p_profile;
  update auth.identities set identity_data = jsonb_build_object('sub', p_profile::text, 'email', login_email(p_login)), updated_at = now()
    where user_id = p_profile and provider = 'email';
end $$;

revoke all on function admin_create_account(text,text,text,text,text,text,text,text) from public, anon;
revoke all on function admin_set_password(uuid,text) from public, anon;
revoke all on function admin_set_login(uuid,text) from public, anon;
grant execute on function admin_create_account(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function admin_set_password(uuid,text) to authenticated;
grant execute on function admin_set_login(uuid,text) to authenticated;
