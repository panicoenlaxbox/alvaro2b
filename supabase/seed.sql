-- Fictional local data. Never put real names, emails or photos here (public repository).
--
-- Local Members sign in through the development-only login at /dev-login with the password
-- "password123". Production only allows Google sign-in.

insert into public.allowed_emails (email, is_admin) values
  ('ana@example.com', true),
  ('bruno@example.com', false),
  ('carla@example.com', false);

-- Creating the auth users fires the sign-up trigger, which creates their Players.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.full_name),
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'ana@example.com', 'Ana'),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'bruno@example.com', 'Bruno'),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'carla@example.com', 'Carla')
) as u (id, email, full_name);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now()
from auth.users u;

-- A Guest, without an account.
insert into public.players (display_name, created_by)
values ('Dani', '11111111-1111-4111-8111-111111111111');
