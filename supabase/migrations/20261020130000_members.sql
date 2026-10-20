-- Members and Guests management.

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

-- Emails are personal data: a Member only sees their own allowlist row; the Admin sees them all.
drop policy "Members read the allowlist" on public.allowed_emails;
create policy "Members read their row, Admin reads all" on public.allowed_emails
  for select to authenticated using (
    (select private.is_admin()) or player_id = (select private.current_player_id())
  );
