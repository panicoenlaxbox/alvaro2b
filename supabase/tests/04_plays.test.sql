-- save_play under a Member's RLS, and the Play rules on Sessions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

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

-- Competitive Play in a planned Session: the Session becomes held and Elena becomes an Attendee
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
select is((select status::text from public.sessions where id = 'b0000000-0000-4000-8000-000000000003'), 'held', 'the first Play turns a planned Session into held');
select ok(
  exists (select 1 from public.session_attendees where session_id = 'b0000000-0000-4000-8000-000000000003' and player_id = (select elena from ids)),
  'a Participant becomes an Attendee'
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

-- Cancelled Sessions take no Plays
reset role;
insert into public.sessions (id, date) values ('c0000000-0000-4000-8000-0000000000aa', private.today() + 3);
update public.sessions set status = 'cancelled' where id = 'c0000000-0000-4000-8000-0000000000aa';
set local role authenticated;
select throws_ok(
  format($$select public.save_play('{"session_id": "c0000000-0000-4000-8000-0000000000aa", "game_id": "a0000000-0000-4000-8000-000000000001",
    "play_mode": "cooperative", "participants": [{"player_id": "%s"}]}')$$, (select ana from ids)),
  'Cannot add Plays to a cancelled Session', 'cancelled Sessions take no Plays'
);

-- Games with Plays cannot be deleted
reset role;
select throws_ok(
  $$delete from public.games where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '23503', null, 'a Game with Plays cannot be deleted'
);

select * from finish();
rollback;
