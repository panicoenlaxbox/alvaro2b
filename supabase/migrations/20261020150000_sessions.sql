-- Sessions, Attendees and RSVPs.

create type public.session_status as enum ('planned', 'held', 'cancelled');
create type public.rsvp_response as enum ('yes', 'maybe', 'no');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  place text check (length(place) <= 120),
  notes text check (length(notes) <= 4000),
  status public.session_status not null default 'held',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_date_idx on public.sessions (date desc);
create index sessions_created_by_idx on public.sessions (created_by);

create trigger set_updated_at before update on public.sessions
  for each row execute function private.set_updated_at();

-- Lifecycle (PRD 4): born held when dated today or earlier, planned otherwise. From planned it
-- moves to held ("¡Empezamos!" or the first Play) or to cancelled. Held and cancelled are final.
create function private.session_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.status := case when new.date > private.today() then 'planned' else 'held' end;
  elsif new.status is distinct from old.status
        and not (old.status = 'planned' and new.status in ('held', 'cancelled')) then
    raise exception 'Invalid Session status change' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.session_lifecycle() from public;

create trigger session_lifecycle before insert or update on public.sessions
  for each row execute function private.session_lifecycle();

create table public.session_attendees (
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, player_id)
);

create index session_attendees_player_id_idx on public.session_attendees (player_id);

-- RSVPs are only for planned Sessions and only from Members, for themselves.
create table public.rsvps (
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade default private.current_player_id(),
  response public.rsvp_response not null,
  updated_at timestamptz not null default now(),
  primary key (session_id, player_id)
);

create index rsvps_player_id_idx on public.rsvps (player_id);

create trigger set_updated_at before update on public.rsvps
  for each row execute function private.set_updated_at();

-- "Voy" makes the Member an Attendee; any other answer removes them.
create function private.sync_rsvp_attendee()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.response = 'yes' then
    insert into public.session_attendees (session_id, player_id)
    values (new.session_id, new.player_id)
    on conflict do nothing;
  else
    delete from public.session_attendees where session_id = new.session_id and player_id = new.player_id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_rsvp_attendee() from public;

create trigger sync_rsvp_attendee after insert or update of response on public.rsvps
  for each row execute function private.sync_rsvp_attendee();

create function private.session_is_planned(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sessions s where s.id = session_id and s.status = 'planned');
$$;

revoke all on function private.session_is_planned(uuid) from public;
grant execute on function private.session_is_planned(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies and grants
-- ---------------------------------------------------------------------------

alter table public.sessions enable row level security;
alter table public.session_attendees enable row level security;
alter table public.rsvps enable row level security;

create policy "Members read sessions" on public.sessions
  for select to authenticated using ((select private.is_member()));
create policy "Members add sessions" on public.sessions
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit sessions" on public.sessions
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Author or Admin delete sessions" on public.sessions
  for delete to authenticated using (
    (select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin()))
  );

create policy "Members read attendees" on public.session_attendees
  for select to authenticated using ((select private.is_member()));
create policy "Members add attendees" on public.session_attendees
  for insert to authenticated with check ((select private.is_member()));
create policy "Members remove attendees" on public.session_attendees
  for delete to authenticated using ((select private.is_member()));

create policy "Members read rsvps" on public.rsvps
  for select to authenticated using ((select private.is_member()));
create policy "Members answer for themselves" on public.rsvps
  for insert to authenticated with check (
    player_id = (select private.current_player_id()) and private.session_is_planned(session_id)
  );
create policy "Members change their answer" on public.rsvps
  for update to authenticated
  using (player_id = (select private.current_player_id()))
  with check (player_id = (select private.current_player_id()) and private.session_is_planned(session_id));

grant select, delete on public.sessions to authenticated;
grant insert (date, place, notes) on public.sessions to authenticated;
grant update (date, place, notes, status) on public.sessions to authenticated;

grant select, delete on public.session_attendees to authenticated;
grant insert (session_id, player_id) on public.session_attendees to authenticated;

grant select on public.rsvps to authenticated;
grant insert (session_id, player_id, response) on public.rsvps to authenticated;
grant update (session_id, player_id, response) on public.rsvps to authenticated;
