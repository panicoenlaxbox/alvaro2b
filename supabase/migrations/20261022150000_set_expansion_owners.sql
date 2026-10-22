-- Replaces an Expansion's owners in one transaction, so an edit never leaves it half-owned
-- (the same as set_game_owners for a Game).
create function public.set_expansion_owners(expansion uuid, owners uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.expansion_owners where expansion_id = expansion and player_id <> all (owners);
  insert into public.expansion_owners (expansion_id, player_id)
  select expansion, unnest(owners)
  on conflict do nothing;
$$;

revoke all on function public.set_expansion_owners(uuid, uuid[]) from public, anon;
grant execute on function public.set_expansion_owners(uuid, uuid[]) to authenticated;
