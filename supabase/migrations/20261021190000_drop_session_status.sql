-- Sessions lose their status (PRD 4): whether one is upcoming or past follows from its date, and a
-- Session that will not happen is deleted instead of cancelled.

drop trigger session_lifecycle on public.sessions;
drop function private.session_lifecycle();

drop trigger play_session_rules on public.plays;
drop function private.play_session_rules();

-- RSVPs and Polls are for upcoming Sessions: dated today or later.
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

drop policy "Members answer for themselves" on public.rsvps;
create policy "Members answer for themselves" on public.rsvps
  for insert to authenticated with check (
    player_id = (select private.current_player_id()) and private.session_is_upcoming(session_id)
  );

drop policy "Members change their answer" on public.rsvps;
create policy "Members change their answer" on public.rsvps
  for update to authenticated
  using (player_id = (select private.current_player_id()))
  with check (player_id = (select private.current_player_id()) and private.session_is_upcoming(session_id));

drop policy "Members open polls on planned sessions" on public.polls;
create policy "Members open polls on upcoming sessions" on public.polls
  for insert to authenticated with check ((select private.is_member()) and private.session_is_upcoming(session_id));

drop function private.session_is_planned(uuid);

alter table public.sessions drop column status;
drop type public.session_status;
