-- Catalog: Games, Expansions and Ratings, plus the private bucket for covers and Photos.

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

-- The group lives in Spain: "today" decides whether a Session is planned or held.
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

-- Missing foreign key indexes from the foundation migration.
create index allowed_emails_added_by_idx on public.allowed_emails (added_by);
create index players_created_by_idx on public.players (created_by);

-- ---------------------------------------------------------------------------
-- Games
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
  owner_id uuid references public.players (id) on delete set null,
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

create index games_owner_id_idx on public.games (owner_id);
create index games_created_by_idx on public.games (created_by);

create trigger set_updated_at before update on public.games
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Expansions
-- ---------------------------------------------------------------------------

create table public.expansions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  year smallint check (year between 1800 and 2100),
  bgg_id integer check (bgg_id > 0),
  owner_id uuid references public.players (id) on delete set null,
  notes text check (length(notes) <= 4000),
  retired_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expansions_game_id_idx on public.expansions (game_id);
create index expansions_owner_id_idx on public.expansions (owner_id);
create index expansions_created_by_idx on public.expansions (created_by);

create trigger set_updated_at before update on public.expansions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ratings
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Policies and grants
-- ---------------------------------------------------------------------------

alter table public.games enable row level security;
alter table public.expansions enable row level security;
alter table public.ratings enable row level security;

create policy "Members read games" on public.games
  for select to authenticated using ((select private.is_member()));
create policy "Members add games" on public.games
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit games" on public.games
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Author or Admin delete games" on public.games
  for delete to authenticated using (
    (select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin()))
  );

create policy "Members read expansions" on public.expansions
  for select to authenticated using ((select private.is_member()));
create policy "Members add expansions" on public.expansions
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit expansions" on public.expansions
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Author or Admin delete expansions" on public.expansions
  for delete to authenticated using (
    (select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin()))
  );

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

grant select, delete on public.games to authenticated;
grant insert (name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode,
              lower_score_wins, bgg_id, owner_id, notes, cover_path, bgg_image_url, retired_at)
  on public.games to authenticated;
grant update (name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode,
              lower_score_wins, bgg_id, owner_id, notes, cover_path, bgg_image_url, retired_at)
  on public.games to authenticated;

grant select, delete on public.expansions to authenticated;
grant insert (game_id, name, year, bgg_id, owner_id, notes, retired_at) on public.expansions to authenticated;
grant update (name, year, bgg_id, owner_id, notes, retired_at) on public.expansions to authenticated;

grant select, delete on public.ratings to authenticated;
grant insert (game_id, player_id, stars) on public.ratings to authenticated;
-- upsert writes every column it inserts; the policies still pin player_id to the Member.
grant update (game_id, player_id, stars) on public.ratings to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: one private bucket for covers (covers/) and Photos (photos/)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']);

create policy "Members read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and (select private.is_member()));
create policy "Members upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select private.is_member()));
create policy "Uploader or Admin delete media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'media'
    and (select private.is_member())
    and (owner_id = (select auth.uid())::text or (select private.is_admin()))
  );
