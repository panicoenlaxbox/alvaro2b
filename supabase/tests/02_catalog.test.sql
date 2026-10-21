-- Catalog rules: Ratings belong to their Member, any Member deletes a Game.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Bruno rates as himself, but cannot write a Rating for Ana
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$insert into public.ratings (game_id, stars) values ('a0000000-0000-4000-8000-000000000003', 4)$$,
  'a Member rates a Game'
);
select throws_ok(
  $$insert into public.ratings (game_id, player_id, stars)
    select 'a0000000-0000-4000-8000-000000000005', id, 1 from public.players where display_name = 'Ana'$$,
  '42501', null, 'a Member cannot rate for someone else'
);
with d as (delete from public.ratings where game_id = 'a0000000-0000-4000-8000-000000000001' and stars = 5 returning 1) select is(count(*)::int, 0, 'a Member cannot delete another Member''s Rating') from d;

-- A Game added by Ana: Bruno, another Member, deletes it
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
insert into public.games (name) values ('Test game');
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
with d as (delete from public.games where name = 'Test game' returning 1) select is(count(*)::int, 1, 'any Member deletes a Game without Plays') from d;

-- Signed-out visitors see nothing
reset role;
set local role anon;
select throws_ok('select count(*) from public.games', '42501', null, 'anon has no access to the Catalog');

select * from finish();
rollback;
