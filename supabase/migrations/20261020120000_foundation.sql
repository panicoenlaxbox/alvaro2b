-- Foundation: Players (Members and Guests), the email allowlist and the keep-alive row.
--
-- Access model (ADR 0005):
--   * Only emails listed in public.allowed_emails can sign up; a trigger on auth.users rejects
--     any other account.
--   * Every RLS policy depends on private.is_member(), which also requires the email to still be
--     on the allowlist, so removing an email revokes access immediately.

create extension if not exists citext with schema extensions;

-- Helper functions live in a schema that the Data API does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

-- A Player is a Member when user_id is set, and a Guest otherwise. Converting a Guest into a
-- Member links the account to the same row, so the history is kept.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 1 and 60),
  user_id uuid unique references auth.users (id) on delete set null,
  avatar_url text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

-- ---------------------------------------------------------------------------
-- Allowlist
-- ---------------------------------------------------------------------------

create table public.allowed_emails (
  email extensions.citext primary key check (email::text ~ '^[^@\s]+@[^@\s]+$'),
  is_admin boolean not null default false,
  -- The Player this email signs in as. Set it beforehand to turn a Guest into a Member; otherwise
  -- the sign-up trigger creates a new Player.
  player_id uuid unique references public.players (id) on delete set null,
  added_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.players p
    join public.allowed_emails a on a.player_id = p.id
    where p.user_id = (select auth.uid())
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.players p
    join public.allowed_emails a on a.player_id = p.id
    where p.user_id = (select auth.uid()) and a.is_admin
  );
$$;

-- The Player row of the signed-in Member.
create function private.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.players p
  join public.allowed_emails a on a.player_id = p.id
  where p.user_id = (select auth.uid());
$$;

revoke all on function private.is_member() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.current_player_id() from public;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_player_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up gate
-- ---------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed public.allowed_emails%rowtype;
  new_player_id uuid;
begin
  select * into allowed from public.allowed_emails where email = new.email::extensions.citext;

  if not found then
    raise exception 'Email is not on the allowlist' using errcode = '42501';
  end if;

  -- Members sign in with Google only (ADR 0005). Any other sign-up method (e.g. email and
  -- password) is rejected, so nobody can claim an allowlisted email before its owner signs in.
  -- Auth confirms emails after this insert, so a row that is already confirmed here can only come
  -- from a direct database insert, like the local seed.
  if coalesce(new.raw_app_meta_data ->> 'provider', '') <> 'google' and new.email_confirmed_at is null then
    raise exception 'Only Google sign-in is allowed' using errcode = '42501';
  end if;

  if allowed.player_id is not null then
    -- Guest becoming a Member: link the account to the existing Player.
    update public.players set user_id = new.id where id = allowed.player_id;
  else
    insert into public.players (display_name, user_id, avatar_url, created_by)
    values (
      left(coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(new.email, '@', 1)
      ), 60),
      new.id,
      new.raw_user_meta_data ->> 'avatar_url',
      new.id
    )
    returning id into new_player_id;

    update public.allowed_emails set player_id = new_player_id where email = allowed.email;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- When an email is (re)added to the allowlist and that account already exists, link it to its
-- Player so the Member regains access without signing up again.
create function private.link_existing_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.player_id is null then
    select p.id into new.player_id
    from auth.users u
    join public.players p on p.user_id = u.id
    where u.email::extensions.citext = new.email;
  end if;
  return new;
end;
$$;

revoke all on function private.link_existing_account() from public;

create trigger link_existing_account
  before insert on public.allowed_emails
  for each row execute function private.link_existing_account();

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

create policy "Members read players" on public.players
  for select to authenticated using ((select private.is_member()));
create policy "Members add players" on public.players
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit players" on public.players
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Author or Admin delete guests" on public.players
  for delete to authenticated using (
    user_id is null
    and ((select private.is_admin()) or created_by = (select auth.uid()))
  );

create policy "Members read the allowlist" on public.allowed_emails
  for select to authenticated using ((select private.is_member()));
create policy "Admin adds emails" on public.allowed_emails
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edits emails" on public.allowed_emails
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin removes emails" on public.allowed_emails
  for delete to authenticated using ((select private.is_admin()));

grant select, delete on public.players to authenticated;
grant insert (display_name, avatar_url) on public.players to authenticated;
grant update (display_name, avatar_url) on public.players to authenticated;
grant select, insert, delete on public.allowed_emails to authenticated;
grant update (is_admin, player_id) on public.allowed_emails to authenticated;

-- ---------------------------------------------------------------------------
-- Keep-alive (ADR 0004)
-- ---------------------------------------------------------------------------

-- A single row that the daily Vercel cron touches with the public key, so the project registers
-- real database activity. It holds no group data.
create table public.keep_alive (
  id smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

insert into public.keep_alive (id) values (1);

alter table public.keep_alive enable row level security;

create policy "Anyone reads the keep-alive row" on public.keep_alive
  for select to anon using (id = 1);
create policy "Anyone touches the keep-alive row" on public.keep_alive
  for update to anon using (id = 1) with check (id = 1);

grant select on public.keep_alive to anon;
grant update (pinged_at) on public.keep_alive to anon;
