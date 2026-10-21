-- Only the Admin adds, renames, deactivates and deletes Players; every Member reads them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- A Guest created by Bruno, before switching roles.
insert into public.players (display_name, created_by) values ('Fede', '22222222-2222-4222-8222-222222222222');
create temp table ids on commit drop as select
  (select id from public.players where display_name = 'Fede') as fede,
  (select id from public.players where display_name = 'Carla') as carla;
grant select on ids to authenticated;

set local role authenticated;

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
select ok((select count(*) from public.players) > 0, 'a Member reads Players');
select throws_ok($$insert into public.players (display_name) values ('Gael')$$, '42501', null, 'a Member cannot add a Guest');
update public.players set display_name = 'Renamed' where id = (select carla from ids);
delete from public.players where id = (select fede from ids);
select throws_ok($$select public.set_guest_active((select fede from ids), false)$$, '42501', null, 'a Member cannot deactivate a Guest');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111'); -- Ana, Admin
select lives_ok($$select public.set_guest_active((select fede from ids), false)$$, 'the Admin deactivates a Guest');
select isnt((select deactivated_at from public.players where id = (select fede from ids)), null, 'a deactivated Guest keeps their row');
select throws_ok(
  $$insert into public.allowed_emails (email, player_id) values ('fede@example.com', (select fede from ids))$$,
  'A deactivated Guest cannot become a Member', 'a deactivated Guest cannot be invited as a Member'
);
select lives_ok($$select public.set_guest_active((select fede from ids), true)$$, 'the Admin reactivates a Guest');
select throws_ok($$select public.set_guest_active((select carla from ids), false)$$, 'P0002', null, 'set_guest_active does not touch Members');
select is((select display_name from public.players where id = (select carla from ids)), 'Carla', 'a Member cannot rename a Player');
select is((select count(*) from public.players where id = (select fede from ids))::int, 1, 'a Member cannot delete a Guest, even one they created');

select lives_ok($$insert into public.players (display_name) values ('Gael')$$, 'the Admin adds a Guest');
update public.players set display_name = 'Carla R.' where id = (select carla from ids);
select is((select display_name from public.players where id = (select carla from ids)), 'Carla R.', 'the Admin renames a Player');
delete from public.players where id = (select fede from ids);
select is((select count(*) from public.players where id = (select fede from ids))::int, 0, 'the Admin deletes a Guest');
delete from public.players where id = (select carla from ids);
select is((select count(*) from public.players where id = (select carla from ids))::int, 1, 'not even the Admin deletes a Member through the table');

select * from finish();
rollback;
