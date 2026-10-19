-- Al Furqan School Okara -- 003: let the app choose account ids + allow deleting accounts.
-- Run once in the Supabase SQL editor (New query -> paste -> Run). Safe to run twice.

drop function if exists admin_create_account(text,text,text,text,text,text,text,text);

create or replace function admin_create_account(
  p_login text, p_password text, p_role text, p_full_name text, p_full_name_ur text,
  p_phone text, p_campus text, p_language text default 'ur', p_id uuid default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := coalesce(p_id, gen_random_uuid()); v_email text := login_email(p_login);
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

create or replace function admin_delete_account(p_profile uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and app_role() <> 'ADMIN' then raise exception 'Only the Admin can delete accounts'; end if;
  if p_profile = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_profile;   -- cascades to profiles and links
end $$;

revoke all on function admin_create_account(text,text,text,text,text,text,text,text,uuid) from public, anon;
revoke all on function admin_delete_account(uuid) from public, anon;
grant execute on function admin_create_account(text,text,text,text,text,text,text,text,uuid) to authenticated;
grant execute on function admin_delete_account(uuid) to authenticated;
