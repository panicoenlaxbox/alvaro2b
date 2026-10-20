-- The Admin manages Members (PRD 1): deactivate a Member (no access, hidden from the pickers,
-- history kept), reactivate them, or delete a Member without history together with their account.

alter table public.players add column deactivated_at timestamptz;

-- Access helpers now ignore deactivated Members.
create or replace function private.is_member()
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

create or replace function private.is_admin()
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

create or replace function private.current_player_id()
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

-- Admins cannot be deactivated (see below), and a deactivated Member cannot become one, so the
-- group always keeps an active Admin.
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

create function public.set_member_active(target uuid, active boolean)
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

-- History means having played, attended a Session or created anything. Ratings, RSVPs, votes and
-- photo tags go with the Player.
create function public.delete_member(target uuid)
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

revoke all on function public.set_member_active(uuid, boolean) from public;
revoke all on function public.delete_member(uuid) from public;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;
grant execute on function public.delete_member(uuid) to authenticated;
