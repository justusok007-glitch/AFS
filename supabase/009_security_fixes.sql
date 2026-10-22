-- Security fixes (found in the review of 001 to 008). Run once in the Supabase SQL editor. Safe to run twice.
--
-- 1) The four admin account functions (create / reset password / change user name / delete) checked
--    "if the caller is signed in and is not ADMIN then stop". A signed-in user WITHOUT an active profile
--    (a deactivated account, or anyone who signed up through the public sign-up link) has no role, the check
--    came out "unknown" instead of "no", and the function ran. Now such callers are refused.
-- 2) A signed-in user could edit any column of their own profile row (name, user name, phone, campus,
--    is_active). Now everyone except the Admin can change only the language of their own profile.

create or replace function admin_create_account(
  p_login text, p_password text, p_role text, p_full_name text, p_full_name_ur text,
  p_phone text, p_campus text, p_language text default 'ur', p_id uuid default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := coalesce(p_id, gen_random_uuid()); v_email text := login_email(p_login);
begin
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can create accounts'; end if;
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
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can reset passwords'; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'Password must be at least 4 characters'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_profile;
end $$;

create or replace function admin_set_login(p_profile uuid, p_login text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can change user names'; end if;
  if exists (select 1 from profiles where upper(login_id) = upper(trim(p_login)) and id <> p_profile) then
    raise exception 'User name % is already taken', p_login; end if;
  update profiles set login_id = upper(trim(p_login)) where id = p_profile;
  update auth.users set email = login_email(p_login), updated_at = now() where id = p_profile;
  update auth.identities set identity_data = jsonb_build_object('sub', p_profile::text, 'email', login_email(p_login)), updated_at = now()
    where user_id = p_profile and provider = 'email';
end $$;

create or replace function admin_delete_account(p_profile uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and coalesce(app_role(), '') <> 'ADMIN' then raise exception 'Only the Admin can delete accounts'; end if;
  if p_profile = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_profile;   -- cascades to profiles and links
end $$;

-- 2) non-admins may change only 'language' on their own profile
create or replace function profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_role('ADMIN') then return new; end if;
  if (to_jsonb(new) - 'language') is distinct from (to_jsonb(old) - 'language') then
    raise exception 'Only the Admin can change account details';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_trg on profiles;
create trigger profiles_guard_trg before update on profiles for each row execute function profiles_guard();
