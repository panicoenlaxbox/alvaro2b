-- Saves that write several rows or tables go through one function each: all or nothing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.names(ids uuid[]) returns text[] language sql as $$
  select coalesce(array_agg(display_name order by display_name), '{}') from public.players where id = any (ids);
$$;

-- Read the Players before acting as a Member; the helpers run as the session's role.
create temp table who as select display_name, id from public.players where display_name in ('Ana', 'Bruno', 'Carla', 'Dani');
grant select on who to authenticated, anon;
create function pg_temp.id(name text) returns uuid language sql as $$ select id from who where display_name = name $$;

set local role authenticated;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla

-- save_game
select lives_ok(
  $$select public.save_game(jsonb_build_object('name', 't-game', 'min_players', 2, 'owner_ids', jsonb_build_array(pg_temp.id('Ana'), pg_temp.id('Bruno'))))$$,
  'save_game creates a Game with its owners'
);
select is(
  (select array_agg(o.player_id order by o.player_id) from public.game_owners o join public.games g on g.id = o.game_id where g.name = 't-game'),
  (select array_agg(id order by id) from who where display_name in ('Ana', 'Bruno')),
  'both owners are saved'
);
select lives_ok(
  $$select public.save_game(jsonb_build_object('id', (select id from public.games where name = 't-game'), 'name', 't-game 2', 'owner_ids', jsonb_build_array(pg_temp.id('Carla'))))$$,
  'save_game edits a Game and replaces its owners'
);
select is(
  (select array_agg(o.player_id) from public.game_owners o join public.games g on g.id = o.game_id where g.name = 't-game 2'),
  array[pg_temp.id('Carla')], 'only the new owner remains'
);
select throws_ok(
  $$select public.save_game(jsonb_build_object('name', 't-guest game', 'owner_ids', jsonb_build_array(pg_temp.id('Dani'))))$$,
  '42501', null, 'save_game fails when an owner is a Guest'
);
select is((select count(*)::int from public.games where name = 't-guest game'), 0, 'and the Game is not created either');
select throws_ok($$select public.save_game('{"name": "Catan"}')$$, '23505', null, 'save_game keeps the unique Game name');
select throws_ok(
  $$select public.save_game('{"id": "00000000-0000-4000-8000-000000000000", "name": "nobody"}')$$,
  'P0002', null, 'save_game on a missing Game says so'
);

-- save_expansion
select lives_ok(
  $$select public.save_expansion(jsonb_build_object('game_id', 'a0000000-0000-4000-8000-000000000004', 'name', 't-exp', 'bgg_id', 7, 'owner_ids', jsonb_build_array(pg_temp.id('Carla'))))$$,
  'save_expansion creates an Expansion with its owners'
);
select is(
  (select e.bgg_id from public.expansions e join public.expansion_owners o on o.expansion_id = e.id where e.name = 't-exp'),
  7, 'with its BGG id and owner'
);
select lives_ok(
  $$select public.save_expansion(jsonb_build_object('id', (select id from public.expansions where name = 't-exp'), 'name', 't-exp 2', 'bgg_id', null, 'owner_ids', '[]'::jsonb))$$,
  'save_expansion edits an Expansion and its owners'
);
select is(
  (select count(*)::int from public.expansion_owners o join public.expansions e on e.id = o.expansion_id where e.name = 't-exp 2' and e.bgg_id is null),
  0, 'the BGG id and the owners are cleared'
);
select throws_ok(
  $$select public.save_expansion(jsonb_build_object('game_id', 'a0000000-0000-4000-8000-000000000004', 'name', 't-guest exp', 'owner_ids', jsonb_build_array(pg_temp.id('Dani'))))$$,
  '42501', null, 'save_expansion fails when an owner is a Guest'
);
select is((select count(*)::int from public.expansions where name = 't-guest exp'), 0, 'and the Expansion is not created either');

-- save_session
select lives_ok(
  $$select public.save_session(jsonb_build_object('id', 'b0000000-0000-4000-8000-000000000001', 'date', '2026-01-10', 'place', 't-place', 'attendee_ids', jsonb_build_array(pg_temp.id('Ana'), pg_temp.id('Bruno'))))$$,
  'save_session edits a Session and its Attendees'
);
select is(
  (select pg_temp.names(array_agg(player_id)) from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000001'),
  array['Ana', 'Bruno'], 'Attendees not ticked are removed'
);
select is(
  (select public.save_session(jsonb_build_object('id', 'b0000000-0000-4000-8000-000000000003', 'date', current_date,
     'attendee_ids', (select jsonb_agg(player_id) from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000003')))
   is not null and (select count(*)::int from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000003' and maybe) > 0),
  true, 'Attendees who stay keep their "maybe"'
);
select throws_ok(
  $$select public.save_session('{"id": "b0000000-0000-4000-8000-000000000004", "date": "2026-01-11", "place": "t-lost", "attendee_ids": ["00000000-0000-4000-8000-000000000000"]}')$$,
  '23503', null, 'save_session fails on an unknown Player'
);
select is(
  (select place from public.sessions where id = 'b0000000-0000-4000-8000-000000000004'),
  null, 'and the Session keeps its fields'
);

-- save_photo
insert into public.photos (session_id, path, thumb_path, width, height, size_bytes, uploaded_by)
values ('b0000000-0000-4000-8000-000000000001', 'photos/t.webp', 'photos/thumbs/t.webp', 10, 10, 100, '33333333-3333-4333-8333-333333333333');
select lives_ok(
  $$select public.save_photo(jsonb_build_object('id', (select id from public.photos where path = 'photos/t.webp'), 'caption', 't-caption', 'tag_ids', jsonb_build_array(pg_temp.id('Ana'), pg_temp.id('Bruno'))))$$,
  'save_photo saves the caption and the tags'
);
select throws_ok(
  $$select public.save_photo(jsonb_build_object('id', (select id from public.photos where path = 'photos/t.webp'), 'caption', 'other',
      'play_id', (select id from public.plays where session_id = 'b0000000-0000-4000-8000-000000000002' limit 1), 'tag_ids', jsonb_build_array(pg_temp.id('Carla'))))$$,
  '23514', 'The Play is not in this Session', 'save_photo refuses a Play from another Session'
);
select is(
  (select pg_temp.names(array_agg(t.player_id)) || array[(select caption from public.photos where path = 'photos/t.webp')]
   from public.photo_tags t join public.photos p on p.id = t.photo_id where p.path = 'photos/t.webp'),
  array['Ana', 'Bruno', 't-caption'], 'and neither the caption nor the tags change'
);

-- start_today
select is(
  public.start_today(current_date, pg_temp.id('Carla')),
  public.start_today(current_date, pg_temp.id('Carla')),
  'start_today reuses today''s Session'
);
select is(
  (select count(*)::int from public.session_attendees a join public.sessions s on s.id = a.session_id
   where s.date = current_date and a.player_id = pg_temp.id('Carla')),
  1, 'and adds the Player once'
);

-- answer_rsvp
select public.answer_rsvp('b0000000-0000-4000-8000-000000000005', pg_temp.id('Carla'), 'maybe');
select public.answer_rsvp('b0000000-0000-4000-8000-000000000005', pg_temp.id('Carla'), 'yes');
select is(
  (select array_agg(maybe) from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000005' and player_id = pg_temp.id('Carla')),
  array[false], 'answer_rsvp keeps one Attendee row and updates "maybe"'
);
select public.answer_rsvp('b0000000-0000-4000-8000-000000000005', pg_temp.id('Carla'), 'no');
select is(
  (select count(*)::int from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000005' and player_id = pg_temp.id('Carla')),
  0, '"no" removes the Attendee row'
);

reset role;
set local role anon;
select throws_ok($$select public.save_game('{"name": "t-anon"}')$$, '42501', null, 'anon cannot save a Game');

select * from finish();
rollback;
