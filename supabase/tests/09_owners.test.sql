-- Owners: a Game or an Expansion can belong to several Members, and only to Members.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla

select is(
  (select count(*)::int from public.game_owners where game_id = 'a0000000-0000-4000-8000-000000000004'),
  2, 'a Game can have several owners (Catan: Ana and Bruno)'
);

select lives_ok(
  $$select public.set_game_owners('a0000000-0000-4000-8000-000000000005',
      array(select id from public.players where display_name in ('Ana', 'Carla')))$$,
  'any Member sets the owners of a Game'
);
select is(
  (select count(*)::int from public.game_owners where game_id = 'a0000000-0000-4000-8000-000000000005'),
  2, 'both owners are saved'
);

select lives_ok(
  $$select public.set_game_owners('a0000000-0000-4000-8000-000000000005',
      array(select id from public.players where display_name = 'Carla'))$$,
  'setting the owners again replaces them'
);
select is(
  (select array_agg(p.display_name) from public.game_owners o join public.players p on p.id = o.player_id
   where o.game_id = 'a0000000-0000-4000-8000-000000000005'),
  array['Carla'], 'only the new owners remain'
);

select throws_ok(
  $$insert into public.game_owners (game_id, player_id)
    select 'a0000000-0000-4000-8000-000000000005', id from public.players where display_name = 'Dani'$$,
  '42501', null, 'a Guest cannot own a Game'
);

select lives_ok(
  $$insert into public.expansion_owners (expansion_id, player_id)
    select 'f0000000-0000-4000-8000-000000000001', id from public.players where display_name = 'Bruno'$$,
  'an Expansion can have several owners too'
);

reset role;
set local role anon;
select throws_ok('select count(*) from public.game_owners', '42501', null, 'anon has no access to owners');

select * from finish();
rollback;
