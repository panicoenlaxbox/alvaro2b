-- A Game or an Expansion can belong to several Members (bought together), or to nobody.
-- The single owner_id columns become two join tables; existing owners move over.

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

insert into public.game_owners (game_id, player_id)
select id, owner_id from public.games where owner_id is not null;

insert into public.expansion_owners (expansion_id, player_id)
select id, owner_id from public.expansions where owner_id is not null;

alter table public.games drop column owner_id;
alter table public.expansions drop column owner_id;

-- Owners are Members (GLOSSARY: Owner), and any Member may change them, as with the rest of a Game.
create function private.is_member_player(player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.players p where p.id = player and p.user_id is not null);
$$;

revoke all on function private.is_member_player(uuid) from public;
grant execute on function private.is_member_player(uuid) to authenticated;

alter table public.game_owners enable row level security;
alter table public.expansion_owners enable row level security;

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

grant select, insert, delete on public.game_owners to authenticated;
grant select, insert, delete on public.expansion_owners to authenticated;

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
