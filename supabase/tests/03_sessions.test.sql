-- Session lifecycle and RSVPs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno

insert into public.sessions (date, place) values (private.today() - 1, 't-held');
insert into public.sessions (date, place) values (private.today(), 't-today');
insert into public.sessions (date, place) values (private.today() + 7, 't-planned');
create temp table ids on commit drop as
  select (select id from public.sessions where place = 't-held') as held, (select id from public.sessions where place = 't-planned') as planned;
select is((select status::text from public.sessions where id = (select held from ids)), 'held', 'a past Session is born held');
select is((select status::text from public.sessions where place = 't-today'), 'planned', 'a Session dated today is born planned');
select is((select status::text from public.sessions where id = (select planned from ids)), 'planned', 'a future Session is born planned');

select throws_ok(
  $$update public.sessions set status = 'cancelled' where id = (select held from ids)$$,
  'Invalid Session status change', 'a held Session cannot be cancelled'
);

-- RSVP "yes" adds the Member as Attendee; "no" removes them
insert into public.rsvps (session_id, response) select planned, 'yes' from ids;
select ok(
  exists (select 1 from public.session_attendees a join public.players p on p.id = a.player_id
          where a.session_id = (select planned from ids) and p.display_name = 'Bruno'),
  'RSVP yes makes the Member an Attendee'
);
update public.rsvps set response = 'no' where session_id = (select planned from ids);
select is(
  (select count(*)::int from public.session_attendees where session_id = (select planned from ids)),
  0, 'RSVP no removes the Attendee'
);

select throws_ok(
  $$insert into public.rsvps (session_id, response) select held, 'yes' from ids$$,
  '42501', null, 'held Sessions take no RSVPs'
);

select lives_ok(
  $$update public.sessions set status = 'cancelled' where id = (select planned from ids)$$,
  'a planned Session can be cancelled'
);
select throws_ok(
  $$update public.sessions set status = 'held' where id = (select planned from ids)$$,
  'Invalid Session status change', 'a cancelled Session stays cancelled'
);

select * from finish();
rollback;
