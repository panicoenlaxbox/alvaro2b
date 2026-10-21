-- save_play under a Member's RLS, and the Play rules on Sessions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

create temp table ids on commit drop as
select (select id from public.players where display_name = 'Ana') as ana,
       (select id from public.players where display_name = 'Bruno') as bruno,
       (select id from public.players where display_name = 'Elena') as elena;
insert into public.players (display_name) values ('Elena');
update ids set elena = (select id from public.players where display_name = 'Elena');
grant select on ids to authenticated;

set local role authenticated;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla

-- Competitive Play in an upcoming Session: Elena becomes an Attendee and Ana, a "maybe", goes for sure
insert into public.session_attendees (session_id, player_id, maybe)
  select 'b0000000-0000-4000-8000-000000000003', ana, true from ids
  on conflict (session_id, player_id) do update set maybe = true;
create temp table saved on commit drop as
select public.save_play(jsonb_build_object(
  'session_id', 'b0000000-0000-4000-8000-000000000003',
  'game_id', 'a0000000-0000-4000-8000-000000000001',
  'play_mode', 'competitive',
  'duration_minutes', 30,
  'participants', jsonb_build_array(
    jsonb_build_object('player_id', (select ana from ids), 'score', 10, 'rank', 1),
    jsonb_build_object('player_id', (select elena from ids), 'score', 8, 'rank', 2))
)) as id;

select is((select count(*)::int from public.participants where play_id = (select id from saved)), 2, 'save_play writes the Participants');
select ok(
  exists (select 1 from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000003' and player_id = (select elena from ids)),
  'a Participant becomes an Attendee'
);
select is(
  (select maybe from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000003' and player_id = (select ana from ids)),
  false, 'a Participant who said maybe goes for sure'
);

-- Editing rewrites the parts: switch to a team Play
select public.save_play(jsonb_build_object(
  'id', (select id from saved),
  'game_id', 'a0000000-0000-4000-8000-000000000003',
  'play_mode', 'team',
  'teams', jsonb_build_array(jsonb_build_object('key', 'r', 'name', 'Rojo', 'won', true), jsonb_build_object('key', 'b', 'name', 'Azul')),
  'participants', jsonb_build_array(
    jsonb_build_object('player_id', (select ana from ids), 'team_key', 'r', 'score', 99),
    jsonb_build_object('player_id', (select bruno from ids), 'team_key', 'b'))
));
select is((select count(*)::int from public.teams where play_id = (select id from saved)), 2, 'editing recreates the Teams');
select is(
  (select score from public.participants where play_id = (select id from saved) and player_id = (select ana from ids)),
  null, 'team Plays keep no individual Score'
);
select is((select count(*)::int from public.participants where play_id = (select id from saved)), 2, 'editing replaces the Participants');

select throws_ok(
  format($$select public.save_play('{"id": "%s", "game_id": "a0000000-0000-4000-8000-000000000003", "play_mode": "team",
    "teams": [{"key": "r", "name": "Rojo"}], "participants": [{"player_id": "%s", "team_key": "x"}]}')$$,
    (select id from saved), (select ana from ids)),
  'Every Participant needs a Team', 'team Participants need a Team'
);

-- Any Member edits and deletes a Play
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
select lives_ok(
  format($$select public.save_play('{"id": "%s", "game_id": "a0000000-0000-4000-8000-000000000002", "play_mode": "cooperative",
    "coop_won": true, "participants": [{"player_id": "%s"}]}')$$, (select id from saved), (select ana from ids)),
  'another Member edits the Play'
);

-- Games with Plays cannot be deleted
reset role;
select throws_ok(
  $$delete from public.games where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '23503', null, 'a Game with Plays cannot be deleted'
);

set local role authenticated;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno, who did not log it
with d as (delete from public.plays where id = (select id from saved) returning 1)
select is(count(*)::int, 1, 'another Member deletes the Play') from d;

select * from finish();
rollback;
