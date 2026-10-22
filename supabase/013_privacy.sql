-- Privacy tightening (found in the security review). Run once in the Supabase SQL editor. Safe to run twice.
--  1) Parents can read only: their own account, the principal / vice principal, and the teachers of THEIR child's section.
--     (before: every parent could read every staff user name and phone number)
--  2) Parents see teacher assignments only for their own child's section.
--  3) A parent may notify only their child's teachers (before: anyone signed in could notify anyone).
--  4) New passwords set by the Admin need at least 6 characters.

-- the teachers of my children's sections (class teacher + subject teachers)
create or replace function my_children_teachers() returns setof uuid
language sql stable security definer set search_path = public as $$
  select ta.teacher_id from teacher_assignments ta join students s on s.section_id = ta.section_id
    where s.id in (select my_children())
  union
  select sec.class_teacher_id from sections sec join students s on s.section_id = sec.id
    where s.id in (select my_children()) and sec.class_teacher_id is not null $$;

create or replace function my_children_sections() returns setof text
language sql stable security definer set search_path = public as $$
  select section_id from students where id in (select my_children()) $$;

-- 1) profiles
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated using (
  id = auth.uid()
  or (app_role() is not null and app_role() <> 'PARENT' and role <> 'PARENT')   -- staff see staff accounts
  or is_role('PRINCIPAL','VICE_PRINCIPAL','ACCOUNTANT')
  or (is_role('TEACHER') and exists (select 1 from parent_students ps where ps.parent_id = profiles.id and ps.student_id in (select visible_students())))
  or (is_role('PARENT') and (role in ('PRINCIPAL','VICE_PRINCIPAL') or id in (select my_children_teachers())
        or id::text in (select c.teacher_id from conversations c where c.parent_id = auth.uid()::text))));

-- 2) teacher assignments
drop policy if exists read_all on teacher_assignments;
create policy read_all on teacher_assignments for select to authenticated using (
  app_role() is not null and (app_role() <> 'PARENT' or section_id in (select my_children_sections())));

-- 3) notifications: staff may notify anyone, a parent only their child's teachers
drop policy if exists notif_insert on notifications;
create policy notif_insert on notifications for insert to authenticated with check (
  (app_role() is not null and app_role() <> 'PARENT')
  or (app_role() = 'PARENT' and (
        user_id in (select t::text from my_children_teachers() t)
        or user_id in (select c.teacher_id from conversations c where c.parent_id = auth.uid()::text))));

-- 4) passwords: at least 6 characters
create or replace function admin_create_account(
  p_login text, p_password text, p_role text, p_full_name text, p_full_name_ur text,
  p_phone text, p_campus text, p_language text default 'ur', p_id uuid default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := coalesce(p_id, gen_random_uuid()); v_email text := login_email(p_login);
begin
  perform set_config('afs.creating', '1', true);   -- tells the sign-up guard this is a legitimate admin-made account
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can create accounts'; end if;
  if exists (select 1 from profiles where upper(login_id) = upper(trim(p_login))) then
    raise exception 'User name % is already taken', p_login; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
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
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can reset passwords'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_profile;
end $$;
