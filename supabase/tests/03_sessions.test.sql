-- Sessions have no status; Attendees go or maybe go.
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

-- Answering "¿Vienes?": "Voy" and "Quizá" are Attendee rows, "No voy" deletes the row
insert into public.session_attendees (session_id, player_id, maybe)
  select upcoming, private.current_player_id(), true from ids;
select is(
  (select maybe from public.session_attendees where session_id = (select upcoming from ids) and player_id = private.current_player_id()),
  true, 'a Member says maybe'
);
select lives_ok(
  $$update public.session_attendees set maybe = false
    where session_id = (select upcoming from ids) and player_id = private.current_player_id()$$,
  'a Member changes maybe to going'
);
delete from public.session_attendees where session_id = (select upcoming from ids) and player_id = private.current_player_id();
select is(
  (select count(*)::int from public.session_attendees where session_id = (select upcoming from ids)),
  0, 'a Member who is not going leaves the Attendees'
);
select hasnt_table('public', 'rsvps', 'RSVPs are folded into Attendees');

-- Optional start time
select lives_ok(
  $$update public.sessions set start_time = '20:30' where id = (select upcoming from ids)$$,
  'a Member sets the start time'
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
