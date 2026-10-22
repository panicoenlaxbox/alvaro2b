-- One function per form that writes more than one row or table, so a save is all or nothing.
-- Like save_play: SECURITY INVOKER, so every statement runs under the caller's RLS policies and
-- column grants. A missing row on update raises P0002, as save_play does.

-- save_game: a Game and its Owners. Without "id" it creates the Game; with it, it edits it.
create function public.save_game(game jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(game ->> 'id', '')::uuid;
  g public.games := jsonb_populate_record(null::public.games, game);
begin
  if v_id is null then
    insert into public.games (name, year, min_players, max_players, min_duration, max_duration, complexity,
                              default_play_mode, lower_score_wins, bgg_id, notes, bgg_image_url)
    values (g.name, g.year, g.min_players, g.max_players, g.min_duration, g.max_duration, g.complexity,
            coalesce(g.default_play_mode, 'competitive'), coalesce(g.lower_score_wins, false), g.bgg_id, g.notes,
            g.bgg_image_url)
    returning id into v_id;
  else
    update public.games set
      name = g.name, year = g.year, min_players = g.min_players, max_players = g.max_players,
      min_duration = g.min_duration, max_duration = g.max_duration, complexity = g.complexity,
      default_play_mode = coalesce(g.default_play_mode, 'competitive'),
      lower_score_wins = coalesce(g.lower_score_wins, false), bgg_id = g.bgg_id, notes = g.notes
    where id = v_id;
    if not found then
      raise exception 'Game not found' using errcode = 'P0002';
    end if;
  end if;

  perform public.set_game_owners(v_id, array(select jsonb_array_elements_text(coalesce(game -> 'owner_ids', '[]'))::uuid));
  return v_id;
end;
$$;

revoke all on function public.save_game(jsonb) from public, anon;
grant execute on function public.save_game(jsonb) to authenticated;

-- save_expansion: an Expansion and its Owners. Without "id" it creates it under "game_id".
create function public.save_expansion(expansion jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(expansion ->> 'id', '')::uuid;
begin
  if v_id is null then
    insert into public.expansions (game_id, name, bgg_id)
    values ((expansion ->> 'game_id')::uuid, expansion ->> 'name', (expansion ->> 'bgg_id')::integer)
    returning id into v_id;
  else
    update public.expansions set name = expansion ->> 'name', bgg_id = (expansion ->> 'bgg_id')::integer
    where id = v_id;
    if not found then
      raise exception 'Expansion not found' using errcode = 'P0002';
    end if;
  end if;

  perform public.set_expansion_owners(v_id, array(select jsonb_array_elements_text(coalesce(expansion -> 'owner_ids', '[]'))::uuid));
  return v_id;
end;
$$;

revoke all on function public.save_expansion(jsonb) from public, anon;
grant execute on function public.save_expansion(jsonb) to authenticated;

-- save_session: a Session and its Attendees. Attendees who stay keep their "maybe".
create function public.save_session(session jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(session ->> 'id', '')::uuid;
  s public.sessions := jsonb_populate_record(null::public.sessions, session);
  attendees uuid[] := array(select jsonb_array_elements_text(coalesce(session -> 'attendee_ids', '[]'))::uuid);
begin
  if v_id is null then
    insert into public.sessions (date, start_time, name, place, notes)
    values (s.date, s.start_time, s.name, s.place, s.notes)
    returning id into v_id;
  else
    update public.sessions set date = s.date, start_time = s.start_time, name = s.name, place = s.place, notes = s.notes
    where id = v_id;
    if not found then
      raise exception 'Session not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.session_attendees where session_id = v_id and player_id <> all (attendees);
  insert into public.session_attendees (session_id, player_id)
  select v_id, unnest(attendees)
  on conflict do nothing;
  return v_id;
end;
$$;

revoke all on function public.save_session(jsonb) from public, anon;
grant execute on function public.save_session(jsonb) to authenticated;

-- save_photo: a Photo's caption, Play and tagged Players. Returns the Photo's Session (or null).
create function public.save_photo(photo jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (photo ->> 'id')::uuid;
  v_session_id uuid;
  tags uuid[] := array(select jsonb_array_elements_text(coalesce(photo -> 'tag_ids', '[]'))::uuid);
begin
  update public.photos set caption = nullif(photo ->> 'caption', ''), play_id = nullif(photo ->> 'play_id', '')::uuid
  where id = v_id
  returning session_id into v_session_id;
  if not found then
    raise exception 'Photo not found' using errcode = 'P0002';
  end if;

  delete from public.photo_tags where photo_id = v_id and player_id <> all (tags);
  insert into public.photo_tags (photo_id, player_id)
  select v_id, unnest(tags)
  on conflict do nothing;
  return v_session_id;
end;
$$;

revoke all on function public.save_photo(jsonb) from public, anon;
grant execute on function public.save_photo(jsonb) to authenticated;

-- start_today: "Empezar" after the dice. Uses the latest Session on `today` or creates it, and adds
-- the Player as an Attendee. `today` comes from the app, which knows the group's time zone.
create function public.start_today(today date, player uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.sessions where date = today order by created_at desc limit 1;
  if v_id is null then
    insert into public.sessions (date) values (today) returning id into v_id;
  end if;

  insert into public.session_attendees (session_id, player_id) values (v_id, player)
  on conflict do nothing;
  return v_id;
end;
$$;

revoke all on function public.start_today(date, uuid) from public, anon;
grant execute on function public.start_today(date, uuid) to authenticated;

-- answer_rsvp: a "¿Vienes?" answer as one statement. "yes" and "maybe" keep the Player's Attendee
-- row (inserting or updating it), "no" removes it. Only "maybe" is ever updated, as its grant allows.
create function public.answer_rsvp(session uuid, player uuid, response text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if response = 'no' then
    delete from public.session_attendees where session_id = session and player_id = player;
  elsif response in ('yes', 'maybe') then
    insert into public.session_attendees (session_id, player_id, maybe) values (session, player, response = 'maybe')
    on conflict (session_id, player_id) do update set maybe = excluded.maybe;
  else
    raise exception 'Unknown answer' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.answer_rsvp(uuid, uuid, text) from public, anon;
grant execute on function public.answer_rsvp(uuid, uuid, text) to authenticated;
