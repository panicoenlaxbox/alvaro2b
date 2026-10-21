-- Sessions have no status: RSVPs are for upcoming ones (dated today or later).
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno

insert into public.sessions (date, place) values (private.today() - 1, 't-past');
insert into public.sessions (date, place) values (private.today(), 't-today');
insert into public.sessions (date, place) values (private.today() + 7, 't-upcoming');
create temp table ids on commit drop as
  select (select id from public.sessions where place = 't-past') as past,
         (select id from public.sessions where place = 't-today') as today,
         (select id from public.sessions where place = 't-upcoming') as upcoming;

select hasnt_column('public', 'sessions', 'status', 'Sessions have no status');

-- RSVP "yes" adds the Member as Attendee; "no" removes them
insert into public.rsvps (session_id, response) select upcoming, 'yes' from ids;
select ok(
  exists (select 1 from public.session_attendees a join public.players p on p.id = a.player_id
          where a.session_id = (select upcoming from ids) and p.display_name = 'Bruno'),
  'RSVP yes makes the Member an Attendee'
);
update public.rsvps set response = 'no' where session_id = (select upcoming from ids);
select is(
  (select count(*)::int from public.session_attendees where session_id = (select upcoming from ids)),
  0, 'RSVP no removes the Attendee'
);

select lives_ok(
  $$insert into public.rsvps (session_id, response) select today, 'yes' from ids$$,
  'a Session dated today takes RSVPs'
);
select throws_ok(
  $$insert into public.rsvps (session_id, response) select past, 'yes' from ids$$,
  '42501', null, 'past Sessions take no RSVPs'
);
select throws_ok(
  $$update public.rsvps set session_id = (select past from ids) where session_id = (select today from ids)$$,
  '42501', null, 'an RSVP cannot move to a past Session'
);

-- Optional name
select lives_ok(
  $$update public.sessions set name = 'Sábado de mazmorreo' where id = (select past from ids)$$,
  'a Member names a Session'
);
select throws_ok(
  $$update public.sessions set name = repeat('x', 61) where id = (select past from ids)$$,
  '23514', null, 'a Session name is at most 60 characters'
);

select * from finish();
rollback;
