-- When each Member last used the app, for the Admin screen. A fresh Google sign-in only moves
-- auth.users.last_sign_in_at, which stays put for weeks while the session lives on; the session's
-- token refresh (about hourly while the app is open) is the live signal. Sessions vanish on sign-out,
-- so the last sign-in is the floor.

create function private.member_last_seen()
returns table (player_id uuid, last_seen_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only the Admin sees when Members last connected' using errcode = '42501';
  end if;
  return query
    select p.id,
           greatest(u.last_sign_in_at, max(s.updated_at), max(s.refreshed_at at time zone 'UTC'))
    from public.players p
    join auth.users u on u.id = p.user_id
    left join auth.sessions s on s.user_id = u.id
    group by p.id, u.last_sign_in_at;
end;
$$;

revoke all on function private.member_last_seen() from public;
grant execute on function private.member_last_seen() to authenticated;

create function public.member_last_seen()
returns table (player_id uuid, last_seen_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.member_last_seen();
$$;

revoke all on function public.member_last_seen() from public;
grant execute on function public.member_last_seen() to authenticated;
