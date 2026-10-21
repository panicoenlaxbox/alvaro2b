-- Only the Admin adds, renames and deletes Players. Every Member still reads them.
-- Accounts link to their Player through security definer triggers, which these policies do not affect.
drop policy "Members add players" on public.players;
drop policy "Members edit players" on public.players;
drop policy "Author or Admin delete guests" on public.players;

create policy "Admin adds players" on public.players
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edits players" on public.players
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin deletes guests" on public.players
  for delete to authenticated using (user_id is null and (select private.is_admin()));

-- The Admin deactivates a Guest (hidden from the pickers, history kept) and reactivates them.
-- Players only grant updates on display_name and avatar_url, so this runs with owner privileges in
-- the private schema, behind a SECURITY INVOKER wrapper, like set_member_active.
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

revoke all on function private.set_guest_active(uuid, boolean) from public;
grant execute on function private.set_guest_active(uuid, boolean) to authenticated;

create function public.set_guest_active(target uuid, active boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_guest_active(target, active);
$$;

revoke all on function public.set_guest_active(uuid, boolean) from public;
grant execute on function public.set_guest_active(uuid, boolean) to authenticated;

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
