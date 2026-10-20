-- Plays: Participants, Teams, Expansions used and results by Play mode (ADR 0003).

create table public.plays (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete restrict,
  game_id uuid not null references public.games (id) on delete restrict,
  play_mode public.play_mode not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes smallint check (duration_minutes between 1 and 6000),
  notes text check (length(notes) <= 4000),
  -- Cooperative only: did the group win? Null when not recorded.
  coop_won boolean,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or started_at is null or ended_at >= started_at),
  check (play_mode = 'cooperative' or coop_won is null)
);

create index plays_session_id_idx on public.plays (session_id);
create index plays_game_id_idx on public.plays (game_id);
create index plays_created_by_idx on public.plays (created_by);

create trigger set_updated_at before update on public.plays
  for each row execute function private.set_updated_at();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  won boolean not null default false
);

create index teams_play_id_idx on public.teams (play_id);

create table public.participants (
  play_id uuid not null references public.plays (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  score numeric(10, 2),
  rank smallint check (rank >= 1),
  team_id uuid references public.teams (id) on delete set null,
  primary key (play_id, player_id)
);

create index participants_player_id_idx on public.participants (player_id);
create index participants_team_id_idx on public.participants (team_id);

create table public.play_expansions (
  play_id uuid not null references public.plays (id) on delete cascade,
  expansion_id uuid not null references public.expansions (id) on delete restrict,
  primary key (play_id, expansion_id)
);

create index play_expansions_expansion_id_idx on public.play_expansions (expansion_id);

-- A Play cannot go into a cancelled Session, and the first Play turns a planned Session into held.
create function private.play_session_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_status public.session_status;
begin
  select status into current_status from public.sessions where id = new.session_id;
  if current_status = 'cancelled' then
    raise exception 'Cannot add Plays to a cancelled Session' using errcode = '23514';
  end if;
  if current_status = 'planned' then
    update public.sessions set status = 'held' where id = new.session_id;
  end if;
  return new;
end;
$$;

revoke all on function private.play_session_rules() from public;

create trigger play_session_rules before insert or update of session_id on public.plays
  for each row execute function private.play_session_rules();

-- Someone who plays but was not an Attendee is added to the Session too (PRD 5).
create function private.participant_attends()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.session_attendees (session_id, player_id)
  select p.session_id, new.player_id from public.plays p where p.id = new.play_id
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function private.participant_attends() from public;

create trigger participant_attends after insert on public.participants
  for each row execute function private.participant_attends();

-- ---------------------------------------------------------------------------
-- save_play: writes a Play and all its parts in one transaction.
-- SECURITY INVOKER, so every statement runs under the caller's RLS policies.
-- ---------------------------------------------------------------------------

create function public.save_play(play jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_play_id uuid := nullif(play ->> 'id', '')::uuid;
  mode public.play_mode := (play ->> 'play_mode')::public.play_mode;
  team jsonb;
  team_ids jsonb := '{}'::jsonb;
  participant jsonb;
begin
  if jsonb_array_length(coalesce(play -> 'participants', '[]')) = 0 then
    raise exception 'A Play needs Participants' using errcode = '23514';
  end if;

  if v_play_id is null then
    insert into public.plays (session_id, game_id, play_mode, started_at, ended_at, duration_minutes, notes, coop_won)
    values (
      (play ->> 'session_id')::uuid, (play ->> 'game_id')::uuid, mode,
      (play ->> 'started_at')::timestamptz, (play ->> 'ended_at')::timestamptz,
      (play ->> 'duration_minutes')::smallint, nullif(play ->> 'notes', ''),
      case when mode = 'cooperative' then (play ->> 'coop_won')::boolean end
    )
    returning id into v_play_id;
  else
    update public.plays set
      game_id = (play ->> 'game_id')::uuid,
      play_mode = mode,
      started_at = (play ->> 'started_at')::timestamptz,
      ended_at = (play ->> 'ended_at')::timestamptz,
      duration_minutes = (play ->> 'duration_minutes')::smallint,
      notes = nullif(play ->> 'notes', ''),
      coop_won = case when mode = 'cooperative' then (play ->> 'coop_won')::boolean end
    where id = v_play_id;
    if not found then
      raise exception 'Play not found' using errcode = 'P0002';
    end if;
    delete from public.participants where participants.play_id = v_play_id;
    delete from public.teams where teams.play_id = v_play_id;
    delete from public.play_expansions where play_expansions.play_id = v_play_id;
  end if;

  if mode = 'team' then
    for team in select * from jsonb_array_elements(coalesce(play -> 'teams', '[]')) loop
      with t as (
        insert into public.teams (play_id, name, won)
        values (v_play_id, team ->> 'name', coalesce((team ->> 'won')::boolean, false))
        returning id
      )
      select team_ids || jsonb_build_object(team ->> 'key', t.id) into team_ids from t;
    end loop;
  end if;

  for participant in select * from jsonb_array_elements(play -> 'participants') loop
    if mode = 'team' and (team_ids ->> (participant ->> 'team_key')) is null then
      raise exception 'Every Participant needs a Team' using errcode = '23514';
    end if;
    insert into public.participants (play_id, player_id, score, rank, team_id)
    values (
      v_play_id,
      (participant ->> 'player_id')::uuid,
      case when mode = 'competitive' then (participant ->> 'score')::numeric end,
      case when mode = 'competitive' then (participant ->> 'rank')::smallint end,
      case when mode = 'team' then (team_ids ->> (participant ->> 'team_key'))::uuid end
    );
  end loop;

  insert into public.play_expansions (play_id, expansion_id)
  select v_play_id, e::uuid from jsonb_array_elements_text(coalesce(play -> 'expansion_ids', '[]')) e;

  return v_play_id;
end;
$$;

revoke all on function public.save_play(jsonb) from public, anon;
grant execute on function public.save_play(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies and grants
-- ---------------------------------------------------------------------------

alter table public.plays enable row level security;
alter table public.teams enable row level security;
alter table public.participants enable row level security;
alter table public.play_expansions enable row level security;

create policy "Members read plays" on public.plays
  for select to authenticated using ((select private.is_member()));
create policy "Members add plays" on public.plays
  for insert to authenticated with check ((select private.is_member()));
create policy "Members edit plays" on public.plays
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Author or Admin delete plays" on public.plays
  for delete to authenticated using (
    (select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin()))
  );

-- The parts of a Play are rewritten whole by save_play, so Members can write all of them.
create policy "Members read teams" on public.teams for select to authenticated using ((select private.is_member()));
create policy "Members add teams" on public.teams for insert to authenticated with check ((select private.is_member()));
create policy "Members remove teams" on public.teams for delete to authenticated using ((select private.is_member()));

create policy "Members read participants" on public.participants for select to authenticated using ((select private.is_member()));
create policy "Members add participants" on public.participants for insert to authenticated with check ((select private.is_member()));
create policy "Members remove participants" on public.participants for delete to authenticated using ((select private.is_member()));

create policy "Members read play expansions" on public.play_expansions for select to authenticated using ((select private.is_member()));
create policy "Members add play expansions" on public.play_expansions for insert to authenticated with check ((select private.is_member()));
create policy "Members remove play expansions" on public.play_expansions for delete to authenticated using ((select private.is_member()));

grant select, delete on public.plays to authenticated;
grant insert (session_id, game_id, play_mode, started_at, ended_at, duration_minutes, notes, coop_won) on public.plays to authenticated;
grant update (game_id, play_mode, started_at, ended_at, duration_minutes, notes, coop_won) on public.plays to authenticated;

grant select, delete on public.teams to authenticated;
grant insert (play_id, name, won) on public.teams to authenticated;

grant select, delete on public.participants to authenticated;
grant insert (play_id, player_id, score, rank, team_id) on public.participants to authenticated;

grant select, delete on public.play_expansions to authenticated;
grant insert (play_id, expansion_id) on public.play_expansions to authenticated;
