-- Admin sees when each Member last connected: the latest of the last sign-in and the session refreshes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- Bruno signed in a month ago and has used the app since; Ana has a sign-in and no session left.
update auth.users set last_sign_in_at = '2026-09-01 10:00+00' where id = '22222222-2222-4222-8222-222222222222';
update auth.users set last_sign_in_at = '2026-10-01 10:00+00' where id = '11111111-1111-4111-8111-111111111111';
delete from auth.sessions where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
insert into auth.sessions (id, user_id, created_at, updated_at, refreshed_at) values
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', '2026-09-01 10:00+00', '2026-10-20 18:00+00', '2026-10-21 19:30'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', '2026-09-05 10:00+00', '2026-10-10 12:00+00', null);
create temp table ids on commit drop as select
  (select id from public.players where display_name = 'Bruno') as bruno,
  (select id from public.players where display_name = 'Ana') as ana;
grant select on ids to authenticated;

set local role authenticated;

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
select throws_ok($$select * from public.member_last_seen()$$, '42501', null, 'only the Admin sees the last connection');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111'); -- Ana, Admin
select is(
  (select last_seen_at from public.member_last_seen() where player_id = (select bruno from ids)),
  '2026-10-21 19:30+00'::timestamptz,
  'the latest session refresh counts as the last connection'
);
select is(
  (select last_seen_at from public.member_last_seen() where player_id = (select ana from ids)),
  '2026-10-01 10:00+00'::timestamptz,
  'without a session the last sign-in counts'
);
select is(
  (select count(*)::int from public.member_last_seen() l join public.players p on p.id = l.player_id where p.user_id is null),
  0,
  'Guests have no connection'
);

reset role;
set local role anon;
select throws_ok($$select * from public.member_last_seen()$$, '42501', null, 'anon cannot call it');

select * from finish();
rollback;
