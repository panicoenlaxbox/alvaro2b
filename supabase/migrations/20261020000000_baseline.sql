-- Baseline: the whole schema in one migration (ADR 0006). It replaces the 23 migrations of the
-- initial build, squashed once before the app had real data; new changes go in new migrations.
--
-- Access model (ADR 0005):
--   * Only emails listed in public.allowed_emails can sign up; a trigger on auth.users rejects
--     any other account.
--   * Every RLS policy depends on private.is_member(), which also requires the email to still be
--     on the allowlist and the Member to be active, so removing an email revokes access at once.
--   * Any Member creates, edits and deletes everything (PRD 0). Only the Admin manages who signs in
--     and the Players. Ratings and Approvals belong to each Member.

create extension if not exists citext with schema extensions;

-- Helper functions live in a schema that the Data API does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- New objects in public get no privileges for the API roles: every table below grants exactly
-- what it needs (CLAUDE.md). Without this, the local stack grants everything by default and the
-- hosted project still grants DELETE, TRUNCATE, REFERENCES and TRIGGER, so local tests could pass
-- with grants that production lacks.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;

-- The hosted project creates public.rls_auto_enable() for the "automatic RLS" setting. It is an
-- event trigger function, so API roles never need to call it; revoking EXECUTE removes it from the
-- Data API (advisor lints 0028 and 0029). It does not exist in the local stack.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The group lives in Spain: "today" decides whether a Session is upcoming or past.
create function private.today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Madrid')::date;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.today() from public;
grant execute on function private.today() to authenticated;

-- ---------------------------------------------------------------------------
-- Players and the allowlist
-- ---------------------------------------------------------------------------

-- A Player is a Member when user_id is set, and a Guest otherwise. Converting a Guest into a
-- Member links the account to the same row, so the history is kept. A deactivated Member has no
-- access and a deactivated Guest is hidden from the pickers; both keep their history.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 1 and 60),
  user_id uuid unique references auth.users (id) on delete set null,
  avatar_url text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create index players_created_by_idx on public.players (created_by);

-- Two Guests cannot share a name (ignoring case and surrounding spaces): with no email to tell them
-- apart, the pickers would show the same name twice. Members may share one, as it comes from Google.
create unique index players_guest_name_key on public.players (lower(btrim(display_name))) where user_id is null;

create table public.allowed_emails (
  email extensions.citext primary key check (email::text ~ '^[^@\s]+@[^@\s]+$'),
  is_admin boolean not null default false,
  -- The Player this email signs in as. Set it beforehand to turn a Guest into a Member; otherwise
  -- the sign-up trigger creates a new Player.
  player_id uuid unique references public.players (id) on delete set null,
  added_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index allowed_emails_added_by_idx on public.allowed_emails (added_by);

alter table public.players enable row level security;
alter table public.allowed_emails enable row level security;

-- Access helpers. They ignore deactivated Members.
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
    where p.user_id = (select auth.uid()) and p.deactivated_at is null
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
    where p.user_id = (select auth.uid()) and p.deactivated_at is null and a.is_admin
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
  where p.user_id = (select auth.uid()) and p.deactivated_at is null;
$$;

-- Owners are Members (GLOSSARY: Owner).
create function private.is_member_player(player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.players p where p.id = player and p.user_id is not null);
$$;

revoke all on function private.is_member() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.current_player_id() from public;
revoke all on function private.is_member_player(uuid) from public;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_player_id() to authenticated;
grant execute on function private.is_member_player(uuid) to authenticated;

-- Sign-up gate.
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

-- The group always keeps at least one Admin, so nobody can lock everyone out of the allowlist.
create function private.keep_one_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_admin and (tg_op = 'DELETE' or not new.is_admin) then
    if not exists (select 1 from public.allowed_emails where is_admin and email <> old.email) then
      raise exception 'The group needs at least one Admin' using errcode = '23514';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function private.keep_one_admin() from public;

create trigger keep_one_admin
  before update of is_admin or delete on public.allowed_emails
  for each row execute function private.keep_one_admin();

-- An email can only be linked beforehand to a Guest. Members already have their own account.
create function private.check_linked_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.player_id is not null
     and new.player_id is distinct from (case when tg_op = 'UPDATE' then old.player_id end)
     and exists (
       select 1 from public.players p
       where p.id = new.player_id
         and p.user_id is not null
         and not exists (
           select 1 from auth.users u where u.id = p.user_id and u.email::extensions.citext = new.email
         )
     ) then
    raise exception 'That Player is already a Member' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.check_linked_player() from public;

-- Runs after link_existing_account (triggers fire in name order).
create trigger tr_check_linked_player
  before insert or update of player_id on public.allowed_emails
  for each row execute function private.check_linked_player();

-- Admins cannot be deactivated (see manageable_member), and a deactivated Member cannot become one,
-- so the group always keeps an active Admin.
create function private.no_deactivated_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_admin and exists (select 1 from public.players where id = new.player_id and deactivated_at is not null) then
    raise exception 'A deactivated Member cannot be Admin' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.no_deactivated_admin() from public;

create trigger no_deactivated_admin
  before update of is_admin on public.allowed_emails
  for each row execute function private.no_deactivated_admin();

-- A deactivated Guest cannot be invited as a Member: reactivate them first.
create function private.no_deactivated_guest_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.player_id is not null
     and exists (select 1 from public.players where id = new.player_id and user_id is null and deactivated_at is not null) then
    raise exception 'A deactivated Guest cannot become a Member' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.no_deactivated_guest_invite() from public;

create trigger no_deactivated_guest_invite
  before insert or update of player_id on public.allowed_emails
  for each row execute function private.no_deactivated_guest_invite();

-- Only the Admin adds, renames and deletes Players. Every Member reads them. Emails are personal
-- data: a Member only sees their own allowlist row; the Admin sees them all. Accounts link to their
-- Player through the security definer triggers above, which these policies do not affect.
create policy "Members read players" on public.players
  for select to authenticated using ((select private.is_member()));
create policy "Admin adds players" on public.players
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edits players" on public.players
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin deletes guests" on public.players
  for delete to authenticated using (user_id is null and (select private.is_admin()));

create policy "Members read their row, Admin reads all" on public.allowed_emails
  for select to authenticated using (
    (select private.is_admin()) or player_id = (select private.current_player_id())
  );
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

-- ---------------------------------------------------------------------------
-- Catalog: Games, Expansions, Owners, Ratings and attachments
-- ---------------------------------------------------------------------------

create type public.play_mode as enum ('competitive', 'cooperative', 'team');

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  year smallint check (year between 1800 and 2100),
  min_players smallint check (min_players between 1 and 100),
  max_players smallint check (max_players between 1 and 100),
  min_duration smallint check (min_duration between 1 and 6000),
  max_duration smallint check (max_duration between 1 and 6000),
  complexity numeric(2, 1) check (complexity between 1 and 5),
  default_play_mode public.play_mode not null default 'competitive',
  lower_score_wins boolean not null default false,
  bgg_id integer check (bgg_id > 0),
  notes text check (length(notes) <= 4000),
  -- Our own uploaded cover (path in the media bucket); it replaces the BGG image when set.
  cover_path text,
  -- Linked, never copied (ADR 0002).
  bgg_image_url text check (bgg_image_url ~ '^https://'),
  retired_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_players is null or min_players is null or max_players >= min_players),
  check (max_duration is null or min_duration is null or max_duration >= min_duration)
);

create index games_created_by_idx on public.games (created_by);

create trigger set_updated_at before update on public.games
  for each row execute function private.set_updated_at();

create table public.expansions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  year smallint check (year between 1800 and 2100),
  bgg_id integer check (bgg_id > 0),
  notes text check (length(notes) <= 4000),
  retired_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expansions_game_id_idx on public.expansions (game_id);
create index expansions_created_by_idx on public.expansions (created_by);

create trigger set_updated_at before update on public.expansions
  for each row execute function private.set_updated_at();

-- Two Games cannot share a name, and neither can two Expansions of the same Game (ignoring case and
-- surrounding spaces). Retired ones count too: bring the old one back instead of adding it again.
create unique index games_name_key on public.games (lower(btrim(name)));
create unique index expansions_game_name_key on public.expansions (game_id, lower(btrim(name)));

-- A Game or an Expansion can belong to several Members (bought together), or to nobody.
create table public.game_owners (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (game_id, player_id)
);

create index game_owners_player_id_idx on public.game_owners (player_id);

create table public.expansion_owners (
  expansion_id uuid not null references public.expansions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (expansion_id, player_id)
);

create index expansion_owners_player_id_idx on public.expansion_owners (player_id);

-- Only Members rate: current_player_id() is null for anyone who is not a Member.
create table public.ratings (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade default private.current_player_id(),
  stars smallint not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (game_id, player_id)
);

create index ratings_player_id_idx on public.ratings (player_id);

create trigger set_updated_at before update on public.ratings
  for each row execute function private.set_updated_at();

-- Attachments (PRD 1): files (an FAQ in PDF, a player aid…) and links (an online tool), without
-- description. Files live in the private attachments bucket under games/<game id>/.
create type public.attachment_kind as enum ('file', 'link');

create table public.game_attachments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  kind public.attachment_kind not null,
  url text check (url ~ '^https?://' and length(url) <= 2000),
  path text unique check (path like 'games/%' and length(path) <= 400),
  file_name text check (length(file_name) between 1 and 200),
  size_bytes integer check (size_bytes > 0),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (
    (kind = 'link' and url is not null and path is null and file_name is null and size_bytes is null)
    or (kind = 'file' and url is null and path is not null and file_name is not null and size_bytes is not null)
  )
);

create index game_attachments_game_id_idx on public.game_attachments (game_id);
create index game_attachments_created_by_idx on public.game_attachments (created_by);

alter table public.games enable row level security;
alter table public.expansions enable row level security;
alter table public.game_owners enable row level security;
alter table public.expansion_owners enable row level security;
alter table public.ratings enable row level security;
alter table public.game_attachments enable row level security;

create policy "Members read games" on public.games
  for select to authenticated using ((select private.is_member()));
create policy "Members add games" on public.games
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit games" on public.games
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete games" on public.games
  for delete to authenticated using ((select private.is_member()));

create policy "Members read expansions" on public.expansions
  for select to authenticated using ((select private.is_member()));
create policy "Members add expansions" on public.expansions
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit expansions" on public.expansions
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete expansions" on public.expansions
  for delete to authenticated using ((select private.is_member()));

create policy "Members read game owners" on public.game_owners
  for select to authenticated using ((select private.is_member()));
create policy "Members add game owners" on public.game_owners
  for insert to authenticated with check ((select private.is_member()) and private.is_member_player(player_id));
create policy "Members remove game owners" on public.game_owners
  for delete to authenticated using ((select private.is_member()));

create policy "Members read expansion owners" on public.expansion_owners
  for select to authenticated using ((select private.is_member()));
create policy "Members add expansion owners" on public.expansion_owners
  for insert to authenticated with check ((select private.is_member()) and private.is_member_player(player_id));
create policy "Members remove expansion owners" on public.expansion_owners
  for delete to authenticated using ((select private.is_member()));

create policy "Members read ratings" on public.ratings
  for select to authenticated using ((select private.is_member()));
create policy "Members add their rating" on public.ratings
  for insert to authenticated with check (player_id = (select private.current_player_id()));
create policy "Members change their rating" on public.ratings
  for update to authenticated
  using (player_id = (select private.current_player_id()))
  with check (player_id = (select private.current_player_id()));
create policy "Members remove their rating" on public.ratings
  for delete to authenticated using (player_id = (select private.current_player_id()));

create policy "Members read attachments" on public.game_attachments
  for select to authenticated using ((select private.is_member()));
create policy "Members add attachments" on public.game_attachments
  for insert to authenticated with check ((select private.is_member()) and created_by = (select auth.uid()));
create policy "Members delete attachments" on public.game_attachments
  for delete to authenticated using ((select private.is_member()));

grant select, delete on public.games to authenticated;
grant insert (name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode,
              lower_score_wins, bgg_id, notes, cover_path, bgg_image_url, retired_at)
  on public.games to authenticated;
grant update (name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode,
              lower_score_wins, bgg_id, notes, cover_path, bgg_image_url, retired_at)
  on public.games to authenticated;

grant select, delete on public.expansions to authenticated;
grant insert (game_id, name, year, bgg_id, notes, retired_at) on public.expansions to authenticated;
grant update (name, year, bgg_id, notes, retired_at) on public.expansions to authenticated;

grant select, insert, delete on public.game_owners to authenticated;
grant select, insert, delete on public.expansion_owners to authenticated;

grant select, delete on public.ratings to authenticated;
grant insert (game_id, player_id, stars) on public.ratings to authenticated;
-- upsert writes every column it inserts; the policies still pin player_id to the Member.
grant update (game_id, player_id, stars) on public.ratings to authenticated;

grant select, delete on public.game_attachments to authenticated;
grant insert (game_id, kind, url, path, file_name, size_bytes) on public.game_attachments to authenticated;

-- Replaces a Game's owners in one transaction, so an edit never leaves it half-owned.
create function public.set_game_owners(game uuid, owners uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.game_owners where game_id = game and player_id <> all (owners);
  insert into public.game_owners (game_id, player_id)
  select game, unnest(owners)
  on conflict do nothing;
$$;

revoke all on function public.set_game_owners(uuid, uuid[]) from public, anon;
grant execute on function public.set_game_owners(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Sessions and Attendees
-- ---------------------------------------------------------------------------

-- No status (PRD 4): a Session is upcoming when dated today or later and past otherwise, and one
-- that will not happen is deleted.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  place text check (length(place) <= 120),
  notes text check (length(notes) <= 4000),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An optional name ("Sábado de mazmorreo"), shown next to the date.
  name text check (length(name) <= 60),
  -- An optional start time, in the group's time zone like the date.
  start_time time
);

create index sessions_date_idx on public.sessions (date desc);
create index sessions_created_by_idx on public.sessions (created_by);

create trigger set_updated_at before update on public.sessions
  for each row execute function private.set_updated_at();

-- An Attendee goes or "maybe" goes; saying no is not being one. A Member's "¿Vienes?" answer is
-- their own Attendee row.
create table public.session_attendees (
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now(),
  maybe boolean not null default false,
  primary key (session_id, player_id)
);

create index session_attendees_player_id_idx on public.session_attendees (player_id);

-- Polls are for upcoming Sessions: dated today or later.
create function private.session_is_upcoming(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sessions s where s.id = session_id and s.date >= private.today());
$$;

revoke all on function private.session_is_upcoming(uuid) from public;
grant execute on function private.session_is_upcoming(uuid) to authenticated;

alter table public.sessions enable row level security;
alter table public.session_attendees enable row level security;

create policy "Members read sessions" on public.sessions
  for select to authenticated using ((select private.is_member()));
create policy "Members add sessions" on public.sessions
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit sessions" on public.sessions
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete sessions" on public.sessions
  for delete to authenticated using ((select private.is_member()));

create policy "Members read attendees" on public.session_attendees
  for select to authenticated using ((select private.is_member()));
create policy "Members add attendees" on public.session_attendees
  for insert to authenticated with check ((select private.is_member()));
create policy "Members change attendees" on public.session_attendees
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members remove attendees" on public.session_attendees
  for delete to authenticated using ((select private.is_member()));

grant select, delete on public.sessions to authenticated;
grant insert (date, place, notes, name, start_time) on public.sessions to authenticated;
grant update (date, place, notes, name, start_time) on public.sessions to authenticated;

grant select, delete on public.session_attendees to authenticated;
grant insert (session_id, player_id, maybe) on public.session_attendees to authenticated;
grant update (maybe) on public.session_attendees to authenticated;

-- ---------------------------------------------------------------------------
-- Plays: Participants, Teams, Expansions used and results by Play mode (ADR 0003)
-- ---------------------------------------------------------------------------

create table public.plays (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete restrict,
  game_id uuid not null references public.games (id) on delete restrict,
  play_mode public.play_mode not null,
  duration_minutes smallint check (duration_minutes between 1 and 6000),
  notes text check (length(notes) <= 4000),
  -- Cooperative only: did the group win? Null when not recorded.
  coop_won boolean,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Named as in production, where it was created next to a check that later went away.
  constraint plays_check1 check (play_mode = 'cooperative' or coop_won is null)
);

create index plays_session_id_idx on public.plays (session_id);
create index plays_game_id_idx on public.plays (game_id);
create index plays_created_by_idx on public.plays (created_by);

create trigger set_updated_at before update on public.plays
  for each row execute function private.set_updated_at();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  won boolean not null default false
);

create index teams_play_id_idx on public.teams (play_id);

create table public.participants (
  play_id uuid not null references public.plays (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  score numeric(10, 2),
  rank smallint check (rank >= 1),
  team_id uuid references public.teams (id) on delete set null,
  primary key (play_id, player_id)
);

create index participants_player_id_idx on public.participants (player_id);
create index participants_team_id_idx on public.participants (team_id);

create table public.play_expansions (
  play_id uuid not null references public.plays (id) on delete cascade,
  expansion_id uuid not null references public.expansions (id) on delete restrict,
  primary key (play_id, expansion_id)
);

create index play_expansions_expansion_id_idx on public.play_expansions (expansion_id);

-- A Participant goes for sure (PRD 5): they join the Session, or stop being a "maybe".
create function private.participant_attends()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.session_attendees (session_id, player_id)
  select p.session_id, new.player_id from public.plays p where p.id = new.play_id
  on conflict (session_id, player_id) do update set maybe = false where public.session_attendees.maybe;
  return new;
end;
$$;

revoke all on function private.participant_attends() from public;

create trigger participant_attends after insert on public.participants
  for each row execute function private.participant_attends();

-- save_play: writes a Play and all its parts in one transaction.
-- SECURITY INVOKER, so every statement runs under the caller's RLS policies.
create function public.save_play(play jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_play_id uuid := nullif(play ->> 'id', '')::uuid;
  mode public.play_mode := (play ->> 'play_mode')::public.play_mode;
  team jsonb;
  team_ids jsonb := '{}'::jsonb;
  participant jsonb;
begin
  if jsonb_array_length(coalesce(play -> 'participants', '[]')) = 0 then
    raise exception 'A Play needs Participants' using errcode = '23514';
  end if;

  if v_play_id is null then
    insert into public.plays (session_id, game_id, play_mode, duration_minutes, notes, coop_won)
    values (
      (play ->> 'session_id')::uuid, (play ->> 'game_id')::uuid, mode,
      (play ->> 'duration_minutes')::smallint, nullif(play ->> 'notes', ''),
      case when mode = 'cooperative' then (play ->> 'coop_won')::boolean end
    )
    returning id into v_play_id;
  else
    update public.plays set
      game_id = (play ->> 'game_id')::uuid,
      play_mode = mode,
      duration_minutes = (play ->> 'duration_minutes')::smallint,
      notes = nullif(play ->> 'notes', ''),
      coop_won = case when mode = 'cooperative' then (play ->> 'coop_won')::boolean end
    where id = v_play_id;
    if not found then
      raise exception 'Play not found' using errcode = 'P0002';
    end if;
    delete from public.participants where participants.play_id = v_play_id;
    delete from public.teams where teams.play_id = v_play_id;
    delete from public.play_expansions where play_expansions.play_id = v_play_id;
  end if;

  if mode = 'team' then
    for team in select * from jsonb_array_elements(coalesce(play -> 'teams', '[]')) loop
      with t as (
        insert into public.teams (play_id, name, won)
        values (v_play_id, team ->> 'name', coalesce((team ->> 'won')::boolean, false))
        returning id
      )
      select team_ids || jsonb_build_object(team ->> 'key', t.id) into team_ids from t;
    end loop;
  end if;

  for participant in select * from jsonb_array_elements(play -> 'participants') loop
    if mode = 'team' and (team_ids ->> (participant ->> 'team_key')) is null then
      raise exception 'Every Participant needs a Team' using errcode = '23514';
    end if;
    insert into public.participants (play_id, player_id, score, rank, team_id)
    values (
      v_play_id,
      (participant ->> 'player_id')::uuid,
      case when mode = 'competitive' then (participant ->> 'score')::numeric end,
      case when mode = 'competitive' then (participant ->> 'rank')::smallint end,
      case when mode = 'team' then (team_ids ->> (participant ->> 'team_key'))::uuid end
    );
  end loop;

  insert into public.play_expansions (play_id, expansion_id)
  select v_play_id, e::uuid from jsonb_array_elements_text(coalesce(play -> 'expansion_ids', '[]')) e;

  return v_play_id;
end;
$$;

revoke all on function public.save_play(jsonb) from public, anon;
grant execute on function public.save_play(jsonb) to authenticated;

alter table public.plays enable row level security;
alter table public.teams enable row level security;
alter table public.participants enable row level security;
alter table public.play_expansions enable row level security;

create policy "Members read plays" on public.plays
  for select to authenticated using ((select private.is_member()));
create policy "Members add plays" on public.plays
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit plays" on public.plays
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete plays" on public.plays
  for delete to authenticated using ((select private.is_member()));

-- The parts of a Play are rewritten whole by save_play, so Members can write all of them.
create policy "Members read teams" on public.teams for select to authenticated using ((select private.is_member()));
create policy "Members add teams" on public.teams for insert to authenticated with check ((select private.is_member()));
create policy "Members remove teams" on public.teams for delete to authenticated using ((select private.is_member()));

create policy "Members read participants" on public.participants for select to authenticated using ((select private.is_member()));
create policy "Members add participants" on public.participants for insert to authenticated with check ((select private.is_member()));
create policy "Members remove participants" on public.participants for delete to authenticated using ((select private.is_member()));

create policy "Members read play expansions" on public.play_expansions for select to authenticated using ((select private.is_member()));
create policy "Members add play expansions" on public.play_expansions for insert to authenticated with check ((select private.is_member()));
create policy "Members remove play expansions" on public.play_expansions for delete to authenticated using ((select private.is_member()));

grant select, delete on public.plays to authenticated;
grant insert (session_id, game_id, play_mode, duration_minutes, notes, coop_won) on public.plays to authenticated;
grant update (game_id, play_mode, duration_minutes, notes, coop_won) on public.plays to authenticated;

grant select, delete on public.teams to authenticated;
grant insert (play_id, name, won) on public.teams to authenticated;

grant select, delete on public.participants to authenticated;
grant insert (play_id, player_id, score, rank, team_id) on public.participants to authenticated;

grant select, delete on public.play_expansions to authenticated;
grant insert (play_id, expansion_id) on public.play_expansions to authenticated;

-- ---------------------------------------------------------------------------
-- Polls: Candidates and Approvals (PRD 6)
-- ---------------------------------------------------------------------------

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  closes_at timestamptz,
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index polls_created_by_idx on public.polls (created_by);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  added_by uuid references public.players (id) on delete set null default private.current_player_id(),
  -- Set by any Member to break ties or settle the result.
  chosen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (poll_id, game_id)
);

create index candidates_game_id_idx on public.candidates (game_id);
create index candidates_added_by_idx on public.candidates (added_by);

create table public.approvals (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade default private.current_player_id(),
  created_at timestamptz not null default now(),
  primary key (candidate_id, player_id)
);

create index approvals_player_id_idx on public.approvals (player_id);

create function private.poll_is_open(poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.polls p
    where p.id = poll_id and p.closed_at is null and (p.closes_at is null or p.closes_at > now())
  );
$$;

create function private.candidate_poll_is_open(candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.poll_is_open((select c.poll_id from public.candidates c where c.id = candidate_id));
$$;

revoke all on function private.poll_is_open(uuid) from public;
revoke all on function private.candidate_poll_is_open(uuid) from public;
grant execute on function private.poll_is_open(uuid) to authenticated;
grant execute on function private.candidate_poll_is_open(uuid) to authenticated;

alter table public.polls enable row level security;
alter table public.candidates enable row level security;
alter table public.approvals enable row level security;

create policy "Members read polls" on public.polls
  for select to authenticated using ((select private.is_member()));
create policy "Members open polls on upcoming sessions" on public.polls
  for insert to authenticated with check ((select private.is_member()) and private.session_is_upcoming(session_id));
create policy "Members manage polls" on public.polls
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete polls" on public.polls
  for delete to authenticated using ((select private.is_member()));

create policy "Members read candidates" on public.candidates
  for select to authenticated using ((select private.is_member()));
create policy "Members propose candidates while open" on public.candidates
  for insert to authenticated
  with check (added_by = (select private.current_player_id()) and private.poll_is_open(poll_id));
create policy "Members choose candidates" on public.candidates
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members withdraw candidates while open" on public.candidates
  for delete to authenticated using ((select private.is_member()) and private.poll_is_open(poll_id));

create policy "Members read approvals" on public.approvals
  for select to authenticated using ((select private.is_member()));
create policy "Members approve while open" on public.approvals
  for insert to authenticated
  with check (player_id = (select private.current_player_id()) and private.candidate_poll_is_open(candidate_id));
create policy "Members withdraw approvals while open" on public.approvals
  for delete to authenticated
  using (player_id = (select private.current_player_id()) and private.candidate_poll_is_open(candidate_id));

grant select, delete on public.polls to authenticated;
grant insert (session_id, closes_at) on public.polls to authenticated;
grant update (closes_at, closed_at) on public.polls to authenticated;

grant select, delete on public.candidates to authenticated;
grant insert (poll_id, game_id, added_by) on public.candidates to authenticated;
grant update (chosen) on public.candidates to authenticated;

grant select, delete on public.approvals to authenticated;
grant insert (candidate_id, player_id) on public.approvals to authenticated;

-- ---------------------------------------------------------------------------
-- Photos: in a Session or in the general Album, with tagged Players and an optional Play (PRD 7)
-- ---------------------------------------------------------------------------

-- Files live in the private media bucket (photos/ and photos/thumbs/), compressed in the browser.
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  -- Null means the general Album.
  session_id uuid references public.sessions (id) on delete restrict,
  play_id uuid references public.plays (id) on delete set null,
  path text not null unique check (path like 'photos/%'),
  thumb_path text not null unique check (thumb_path like 'photos/thumbs/%'),
  width smallint not null check (width > 0),
  height smallint not null check (height > 0),
  size_bytes integer not null check (size_bytes > 0),
  caption text check (length(caption) <= 500),
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index photos_session_id_idx on public.photos (session_id);
create index photos_play_id_idx on public.photos (play_id);
create index photos_uploaded_by_idx on public.photos (uploaded_by);
create index photos_created_at_idx on public.photos (created_at desc);

-- A tagged Play must belong to the Photo's Session.
create function private.photo_play_in_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.play_id is not null
     and not exists (select 1 from public.plays p where p.id = new.play_id and p.session_id is not distinct from new.session_id) then
    raise exception 'The Play is not in this Session' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.photo_play_in_session() from public;

create trigger photo_play_in_session before insert or update of play_id, session_id on public.photos
  for each row execute function private.photo_play_in_session();

create table public.photo_tags (
  photo_id uuid not null references public.photos (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (photo_id, player_id)
);

create index photo_tags_player_id_idx on public.photo_tags (player_id);

alter table public.photos enable row level security;
alter table public.photo_tags enable row level security;

create policy "Members read photos" on public.photos
  for select to authenticated using ((select private.is_member()));
create policy "Members upload photos" on public.photos
  for insert to authenticated with check ((select private.is_member()) and uploaded_by = (select auth.uid()));
create policy "Members edit photos" on public.photos
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members delete photos" on public.photos
  for delete to authenticated using ((select private.is_member()));

create policy "Members read photo tags" on public.photo_tags
  for select to authenticated using ((select private.is_member()));
create policy "Members tag photos" on public.photo_tags
  for insert to authenticated with check ((select private.is_member()));
create policy "Members untag photos" on public.photo_tags
  for delete to authenticated using ((select private.is_member()));

grant select, delete on public.photos to authenticated;
grant insert (session_id, play_id, path, thumb_path, width, height, size_bytes, caption, uploaded_by) on public.photos to authenticated;
grant update (session_id, play_id, caption) on public.photos to authenticated;

grant select, delete on public.photo_tags to authenticated;
grant insert (photo_id, player_id) on public.photo_tags to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: Members and Guests (PRD 0)
-- ---------------------------------------------------------------------------

-- These run with owner privileges, so they live in the private schema, which the API does not
-- expose; the API gets SECURITY INVOKER wrappers with the same signature.

-- The Member behind a Player, checked for the Admin actions below. Returns their user id.
create function private.manageable_member(target uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  member_user uuid;
  member_is_admin boolean;
begin
  if not private.is_admin() then
    raise exception 'Only the Admin manages Members' using errcode = '42501';
  end if;
  select p.user_id, a.is_admin into member_user, member_is_admin
  from public.players p
  join public.allowed_emails a on a.player_id = p.id
  where p.id = target and p.user_id is not null;
  if member_user is null then
    raise exception 'Not a Member' using errcode = 'P0002';
  end if;
  if member_user = (select auth.uid()) then
    raise exception 'The Admin cannot manage themselves' using errcode = '42501';
  end if;
  if member_is_admin then
    raise exception 'Remove the Admin role first' using errcode = '23514';
  end if;
  return member_user;
end;
$$;

revoke all on function private.manageable_member(uuid) from public;

-- Deactivate a Member (no access, hidden from the pickers, history kept) or reactivate them.
create function private.set_member_active(target uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.manageable_member(target);
  update public.players set deactivated_at = case when active then null else now() end where id = target;
end;
$$;

-- Delete a Member without history together with their account. History means having played,
-- attended a Session or created anything. Ratings, votes and photo tags go with the Player.
create function private.delete_member(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_user uuid := private.manageable_member(target);
begin
  if exists (select 1 from public.participants where player_id = target)
     or exists (select 1 from public.session_attendees where player_id = target) then
    raise exception 'The Member has history' using errcode = '23503';
  end if;
  delete from public.allowed_emails where player_id = target;
  delete from public.players where id = target;
  delete from auth.users where id = member_user;
exception
  when foreign_key_violation then
    raise exception 'The Member has history' using errcode = '23503';
end;
$$;

-- Deactivate a Guest (hidden from the pickers, history kept) or reactivate them. Players only grant
-- updates on display_name and avatar_url, so this runs with owner privileges.
create function private.set_guest_active(target uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only the Admin manages Guests' using errcode = '42501';
  end if;
  update public.players set deactivated_at = case when active then null else now() end
  where id = target and user_id is null;
  if not found then
    raise exception 'Not a Guest' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function private.set_member_active(uuid, boolean) from public;
revoke all on function private.delete_member(uuid) from public;
revoke all on function private.set_guest_active(uuid, boolean) from public;
grant execute on function private.set_member_active(uuid, boolean) to authenticated;
grant execute on function private.delete_member(uuid) to authenticated;
grant execute on function private.set_guest_active(uuid, boolean) to authenticated;

create function public.set_member_active(target uuid, active boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_member_active(target, active);
$$;

create function public.delete_member(target uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_member(target);
$$;

create function public.set_guest_active(target uuid, active boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_guest_active(target, active);
$$;

revoke all on function public.set_member_active(uuid, boolean) from public;
revoke all on function public.delete_member(uuid) from public;
revoke all on function public.set_guest_active(uuid, boolean) from public;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;
grant execute on function public.delete_member(uuid) to authenticated;
grant execute on function public.set_guest_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private buckets for media (covers/ and photos/) and Game attachments (games/)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']);

-- Documents and images only (no HTML or scripts), up to 20 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 20971520, array[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet'
]);

create policy "Members read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and (select private.is_member()));
create policy "Members upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select private.is_member()));
create policy "Members delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select private.is_member()));

create policy "Members read attachment files" on storage.objects
  for select to authenticated using (bucket_id = 'attachments' and (select private.is_member()));
create policy "Members upload attachment files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'attachments' and (select private.is_member()) and name like 'games/%'
  );
create policy "Members delete attachment files" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments' and (select private.is_member()));
