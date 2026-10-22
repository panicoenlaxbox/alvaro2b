-- Triggers write the Audit log; only the Admin reads it and nobody edits it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- Without a signed-in user (seeds, sign-up triggers) nothing is logged.
insert into public.games (name) values ('t-unlogged');
select is((select count(*)::int from public.audit_entries where label = 't-unlogged'), 0, 'a write without a user leaves no entry');

create temp table ids on commit drop as
  select (select id from public.players where user_id = '22222222-2222-4222-8222-222222222222') as bruno;
grant select on ids to authenticated;

set local role authenticated;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno

insert into public.games (name) values ('t-game');
update public.games set name = 't-game renamed' where name = 't-game';
insert into public.sessions (date, place, name) values ('2030-05-04', 't-place', 't-session');
insert into public.session_attendees (session_id, player_id)
  select s.id, b.bruno from public.sessions s, ids b where s.name = 't-session';

select is((select count(*)::int from public.audit_entries), 0, 'a Member does not read the Audit log');
select throws_ok(
  $$insert into public.audit_entries (action, kind, label) values ('create', 'game', 'forged')$$,
  '42501', null, 'a Member cannot write an entry'
);

-- Deleting the Session cascades to its Attendee: only the Session is logged.
delete from public.sessions where name = 't-session';

select pg_temp.act_as('11111111-1111-4111-8111-111111111111'); -- Ana, Admin

select results_eq(
  $$select action::text, kind::text, label from public.audit_entries
    where actor_id = (select bruno from ids) order by id$$,
  $$values ('create', 'game', 't-game'), ('update', 'game', 't-game renamed'),
           ('create', 'session', 't-session · 04/05/2030'), ('create', 'attendee', 'Bruno en t-session · 04/05/2030'),
           ('delete', 'session', 't-session · 04/05/2030')$$,
  'each write leaves one entry with its author and a label'
);
select is(
  (select ref_id from public.audit_entries where label = 't-game renamed'),
  (select id from public.games where name = 't-game renamed'),
  'an entry points to its Game'
);
select is(
  (select count(*)::int from public.audit_entries where kind = 'attendee' and action = 'delete'),
  0, 'a cascaded delete leaves no entry'
);

-- An Expansion and a Rating point to their Game.
insert into public.expansions (game_id, name) select id, 't-expansion' from public.games where name = 't-game renamed';
select is(
  (select label from public.audit_entries where kind = 'expansion'),
  't-game renamed: t-expansion', 'an Expansion is labelled with its Game'
);
insert into public.ratings (game_id, stars) select id, 4 from public.games where name = 't-game renamed';
select is(
  (select label from public.audit_entries where kind = 'rating'),
  't-game renamed (4★)', 'a Rating is labelled with its Game and stars'
);

-- The Admin's own changes to Players are logged too.
insert into public.players (display_name) values ('t-guest');
select is(
  (select actor_id from public.audit_entries where kind = 'player' and label = 't-guest'),
  (select id from public.players where user_id = '11111111-1111-4111-8111-111111111111'),
  'the Admin is the author of their changes'
);

-- save_play leaves one entry for the Play, not one per Participant joining the Session.
select public.save_play(jsonb_build_object(
  'session_id', 'b0000000-0000-4000-8000-000000000003',
  'game_id', 'a0000000-0000-4000-8000-000000000001',
  'play_mode', 'competitive',
  'participants', jsonb_build_array(jsonb_build_object('player_id', (select bruno from ids), 'rank', 1))
));
select results_eq(
  $$select kind::text from public.audit_entries where kind = 'play' or ref_id = 'b0000000-0000-4000-8000-000000000003'$$,
  $$values ('play')$$,
  'save_play logs only the Play'
);

-- Not even the Admin edits or deletes the log.
select throws_ok($$update public.audit_entries set label = 'x'$$, '42501', null, 'the Admin cannot edit an entry');
select throws_ok($$delete from public.audit_entries$$, '42501', null, 'the Admin cannot delete an entry');
select ok((select count(*) from public.audit_entries) > 0, 'the Admin reads the Audit log');

select * from finish();
rollback;
