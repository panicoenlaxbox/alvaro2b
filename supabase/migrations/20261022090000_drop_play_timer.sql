-- Plays lose the timer (PRD 5): the duration is typed in, there is no "Empezar con cronómetro".

-- save_play no longer writes started_at and ended_at.
create or replace function public.save_play(play jsonb)
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
    insert into public.plays (session_id, game_id, play_mode, duration_minutes, notes, coop_won)
    values (
      (play ->> 'session_id')::uuid, (play ->> 'game_id')::uuid, mode,
      (play ->> 'duration_minutes')::smallint, nullif(play ->> 'notes', ''),
      case when mode = 'cooperative' then (play ->> 'coop_won')::boolean end
    )
    returning id into v_play_id;
  else
    update public.plays set
      game_id = (play ->> 'game_id')::uuid,
      play_mode = mode,
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

alter table public.plays drop column started_at, drop column ended_at;
