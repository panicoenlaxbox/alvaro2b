-- Access model: allowlist, Google-only sign-up, Admin rules and RLS on emails.
-- Runs against the seeded local database: pnpm supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Sign-up gate
select throws_ok(
  $$insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
            'stranger@example.com', '{"provider":"google"}')$$,
  'Email is not on the allowlist', 'unknown emails cannot sign up'
);

insert into public.allowed_emails (email) values ('eva@example.com');
select throws_ok(
  $$insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
            'eva@example.com', '{"provider":"email"}')$$,
  'Only Google sign-in is allowed', 'allowlisted emails cannot sign up with a password'
);

select lives_ok(
  $$insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
    values ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated',
            'authenticated', 'eva@example.com', '{"provider":"google"}', '{"full_name":"Eva"}')$$,
  'allowlisted Google accounts sign up'
);
select is(
  (select display_name from public.players where user_id = '55555555-5555-4555-8555-555555555555'),
  'Eva', 'sign-up creates the Player with the Google name'
);

-- Guest becoming a Member keeps the same Player row
insert into public.allowed_emails (email, player_id)
select 'dani@example.com', id from public.players where display_name = 'Dani';
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
values ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated',
        'authenticated', 'dani@example.com', '{"provider":"google"}');
select is(
  (select user_id from public.players where display_name = 'Dani'),
  '44444444-4444-4444-8444-444444444444'::uuid, 'a Guest keeps their Player when becoming a Member'
);

select throws_ok(
  $$insert into public.allowed_emails (email, player_id)
    select 'other@example.com', id from public.players where display_name = 'Bruno'$$,
  'That Player is already a Member', 'an email cannot be linked to another Member'
);

-- Admin rules
select throws_ok(
  $$update public.allowed_emails set is_admin = false where email = 'ana@example.com'$$,
  'The group needs at least one Admin', 'the last Admin cannot be demoted'
);

-- RLS: a Member only sees their own email; revoking access hides everything
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select results_eq('select email::text from public.allowed_emails', $$values ('bruno@example.com')$$, 'Members only see their own email');

reset role;
delete from public.allowed_emails where email = 'bruno@example.com';
set local role authenticated;
select is((select count(*) from public.players)::int, 0, 'a removed Member sees no data');

select * from finish();
rollback;
