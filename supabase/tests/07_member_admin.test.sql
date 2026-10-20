-- Admin manages Members: deactivate, reactivate and delete without history.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- A Member without history, created before switching roles.
insert into public.allowed_emails (email) values ('eva@example.com');
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
values ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated',
        'authenticated', 'eva@example.com', '{"provider":"google"}');
create temp table ids on commit drop as select
  (select id from public.players where display_name = 'Bruno') as bruno,
  (select id from public.players where display_name = 'Ana') as ana,
  (select id from public.players where user_id = '55555555-5555-4555-8555-555555555555') as eva;
grant select on ids to authenticated;

set local role authenticated;

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
select throws_ok($$select public.set_member_active((select ana from ids), false)$$, '42501', null, 'only the Admin deactivates Members');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111'); -- Ana, Admin
select lives_ok($$select public.set_member_active((select bruno from ids), false)$$, 'the Admin deactivates a Member');
select throws_ok($$select public.set_member_active((select ana from ids), false)$$, '42501', null, 'the Admin cannot deactivate themselves');
select throws_ok(
  $$update public.allowed_emails set is_admin = true where player_id = (select bruno from ids)$$,
  'A deactivated Member cannot be Admin', 'a deactivated Member cannot be made Admin'
);

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno, deactivated
select is((select private.is_member()), false, 'a deactivated Member loses access');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok($$select public.set_member_active((select bruno from ids), true)$$, 'the Admin reactivates a Member');
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is((select private.is_member()), true, 'a reactivated Member has access again');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select throws_ok($$select public.delete_member((select bruno from ids))$$, '23503', null, 'a Member with history cannot be deleted');
select lives_ok($$select public.delete_member((select eva from ids))$$, 'the Admin deletes a Member without history');

reset role;
select is((select count(*)::int from auth.users where id = '55555555-5555-4555-8555-555555555555'), 0, 'deleting a Member deletes their account');
select is((select count(*)::int from public.allowed_emails where email = 'eva@example.com'), 0, 'deleting a Member removes their email');

select * from finish();
rollback;
