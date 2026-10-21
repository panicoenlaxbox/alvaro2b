-- RSVPs fold into Attendees (PRD 4): an Attendee goes or "maybe" goes, and saying no is not being one.
-- One list instead of two that could disagree.

alter table public.session_attendees add column maybe boolean not null default false;

grant insert (maybe), update (maybe) on public.session_attendees to authenticated;

create policy "Members change attendees" on public.session_attendees
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));

-- A Participant goes for sure: they join the Session, or stop being a "maybe".
create or replace function private.participant_attends()
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

drop trigger sync_rsvp_attendee on public.rsvps;
drop function private.sync_rsvp_attendee();
drop table public.rsvps;
drop type public.rsvp_response;
