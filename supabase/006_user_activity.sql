-- User activity (who used the app and when). Run once in the Supabase SQL editor.
-- Each logged-in phone calls touch_activity() about every 5 minutes while the app is open.
-- One row per person per day (Pakistan time). Only the Admin can read; nobody writes directly.

create table if not exists user_activity (
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  pings integer not null default 1,
  primary key (user_id, day)
);

alter table user_activity enable row level security;
drop policy if exists admin_read on user_activity;
create policy admin_read on user_activity for select to authenticated using (app_role() = 'ADMIN');

create or replace function touch_activity() returns void
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Karachi')::date;
begin
  if auth.uid() is null or app_role() is null then return; end if;
  insert into user_activity (user_id, day) values (auth.uid(), d)
  on conflict (user_id, day) do update set last_seen = now(), pings = user_activity.pings + 1;
end $$;

-- server clock, so a wrong phone date cannot distort "active now"
create or replace function activity_now() returns timestamptz
language sql stable security definer set search_path = public as $$ select now() $$;

-- keeps the table small: rows older than 90 days are removed whenever the Admin loads the screen
create or replace function prune_activity() returns void
language plpgsql security definer set search_path = public as $$
begin
  if app_role() = 'ADMIN' then
    delete from user_activity where day < (now() at time zone 'Asia/Karachi')::date - 90;
  end if;
end $$;

grant execute on function touch_activity() to authenticated;
grant execute on function activity_now() to authenticated;
grant execute on function prune_activity() to authenticated;
