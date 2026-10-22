-- Closes public sign-up INSIDE the database, whatever the dashboard switch says.
-- New login accounts can only be created by admin_create_account(). Anything else (the public sign-up
-- request, an invite from the dashboard) is refused. Run once in the Supabase SQL editor. Safe to run twice.

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

create or replace function block_public_signup() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('afs.creating', true), '') <> '1' then
    raise exception 'Sign-up is closed. Ask the school Admin to create your account.';
  end if;
  return new;
end $$;
drop trigger if exists block_public_signup_trg on auth.users;
create trigger block_public_signup_trg before insert on auth.users for each row execute function block_public_signup();
