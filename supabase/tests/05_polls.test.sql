-- Poll rules: upcoming Sessions only, Members vote for themselves while open, Vetoes, creator rights.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno

select throws_ok(
  $$insert into public.polls (session_id) values ('b0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'past Sessions cannot get a Poll'
);

select lives_ok(
  $$insert into public.approvals (candidate_id) values ('e0000000-0000-4000-8000-000000000003')$$,
  'a Member approves a Candidate'
);
select throws_ok(
  $$insert into public.approvals (candidate_id, player_id)
    select 'e0000000-0000-4000-8000-000000000003', id from public.players where display_name = 'Dani'$$,
  '42501', null, 'nobody votes for a Guest'
);
select lives_ok(
  $$insert into public.vetoes (poll_id, candidate_id) values ('d0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001')$$,
  'a Member vetoes when the Poll allows it'
);
select throws_ok(
  $$insert into public.vetoes (poll_id, candidate_id) values ('d0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002')$$,
  '23505', null, 'one Veto per Member and Poll'
);

-- Only the creator (Ana) closes the Poll or marks Candidates as chosen
with u as (update public.polls set closed_at = now() where id = 'd0000000-0000-4000-8000-000000000001' returning 1)
select is(count(*)::int, 0, 'another Member cannot close the Poll') from u;
with u as (update public.candidates set chosen = true where id = 'e0000000-0000-4000-8000-000000000002' returning 1)
select is(count(*)::int, 0, 'another Member cannot choose a Candidate') from u;

select pg_temp.act_as('11111111-1111-4111-8111-111111111111'); -- Ana, the creator
with u as (update public.polls set closed_at = now() where id = 'd0000000-0000-4000-8000-000000000001' returning 1)
select is(count(*)::int, 1, 'the creator closes the Poll') from u;

select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla
select throws_ok(
  $$insert into public.approvals (candidate_id) values ('e0000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'nobody votes once the Poll is closed'
);

select * from finish();
rollback;
