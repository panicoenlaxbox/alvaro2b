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

-- Catalog. Game names are public titles; owners are the fictional Members above.
insert into public.games (id, name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, lower_score_wins, owner_id, created_by)
select g.id, g.name, g.year, g.min_p, g.max_p, g.min_d, g.max_d, g.cx, g.mode::public.play_mode, g.lower, p.id, '11111111-1111-4111-8111-111111111111'
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'Azul', 2017, 2, 4, 30, 45, 1.8, 'competitive', false, 'Ana'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Pandemic', 2008, 2, 4, 45, 45, 2.4, 'cooperative', false, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'Codenames', 2015, 2, 8, 15, 15, 1.3, 'team', false, 'Carla'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'Catan', 1995, 3, 4, 60, 120, 2.3, 'competitive', false, 'Ana'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'Golf', 2020, 2, 6, 20, 20, 1.1, 'competitive', true, null),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'Wingspan', 2019, 1, 5, 40, 70, 2.5, 'competitive', false, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 'The Resistance', 2009, 5, 10, 30, 30, 1.6, 'team', false, 'Carla')
) as g (id, name, year, min_p, max_p, min_d, max_d, cx, mode, lower, owner)
left join public.players p on p.display_name = g.owner;

insert into public.expansions (game_id, name, owner_id, created_by)
select 'a0000000-0000-4000-8000-000000000004', 'Navegantes', id, '11111111-1111-4111-8111-111111111111'
from public.players where display_name = 'Ana';

insert into public.ratings (game_id, player_id, stars)
select r.game_id, p.id, r.stars
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'Ana', 5), ('a0000000-0000-4000-8000-000000000001'::uuid, 'Bruno', 4),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Carla', 4), ('a0000000-0000-4000-8000-000000000004'::uuid, 'Bruno', 2),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'Ana', 5), ('a0000000-0000-4000-8000-000000000006'::uuid, 'Carla', 3)
) as r (game_id, name, stars)
join public.players p on p.display_name = r.name;

-- Sessions relative to the reset date, so the seed always has past, future and pending ones.
insert into public.sessions (id, date, place, created_by) values
  ('b0000000-0000-4000-8000-000000000001', private.today() - 30, 'Casa de Ana', '11111111-1111-4111-8111-111111111111'),
  ('b0000000-0000-4000-8000-000000000002', private.today() - 9, 'Bar La Partida', '22222222-2222-4222-8222-222222222222');
-- Planned Sessions are created in the future; one is then moved to the past to be pending close.
insert into public.sessions (id, date, place, created_by) values
  ('b0000000-0000-4000-8000-000000000003', private.today() + 4, 'Casa de Carla', '33333333-3333-4333-8333-333333333333'),
  ('b0000000-0000-4000-8000-000000000004', private.today() + 1, null, '11111111-1111-4111-8111-111111111111');
update public.sessions set date = private.today() - 2 where id = 'b0000000-0000-4000-8000-000000000004';

insert into public.session_attendees (session_id, player_id)
select s.session_id, p.id
from (values
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'Ana'), ('b0000000-0000-4000-8000-000000000001'::uuid, 'Bruno'),
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'Carla'), ('b0000000-0000-4000-8000-000000000001'::uuid, 'Dani'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'Ana'), ('b0000000-0000-4000-8000-000000000002'::uuid, 'Bruno'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'Carla')
) as s (session_id, name)
join public.players p on p.display_name = s.name;

insert into public.rsvps (session_id, player_id, response)
select 'b0000000-0000-4000-8000-000000000003', p.id, r.response::public.rsvp_response
from (values ('Carla', 'yes'), ('Bruno', 'maybe')) as r (name, response)
join public.players p on p.display_name = r.name;

-- Plays in the held Sessions, one per Play mode plus a tie.
do $$
declare
  p_ana uuid := (select id from public.players where display_name = 'Ana');
  p_bruno uuid := (select id from public.players where display_name = 'Bruno');
  p_carla uuid := (select id from public.players where display_name = 'Carla');
  p_dani uuid := (select id from public.players where display_name = 'Dani');
  play uuid;
  red uuid;
  blue uuid;
begin
  insert into public.plays (session_id, game_id, play_mode, duration_minutes, notes, created_by)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'competitive', 40, 'Ana remontó al final.', '11111111-1111-4111-8111-111111111111')
  returning id into play;
  insert into public.participants (play_id, player_id, score, rank) values
    (play, p_ana, 78, 1), (play, p_bruno, 65, 2), (play, p_carla, 61, 3), (play, p_dani, 40, 4);

  insert into public.plays (session_id, game_id, play_mode, duration_minutes, coop_won, created_by)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'cooperative', 55, true, '11111111-1111-4111-8111-111111111111')
  returning id into play;
  insert into public.participants (play_id, player_id) values (play, p_ana), (play, p_bruno), (play, p_carla), (play, p_dani);

  insert into public.plays (session_id, game_id, play_mode, duration_minutes, created_by)
  values ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'team', 20, '22222222-2222-4222-8222-222222222222')
  returning id into play;
  insert into public.teams (play_id, name, won) values (play, 'Rojo', true) returning id into red;
  insert into public.teams (play_id, name, won) values (play, 'Azul', false) returning id into blue;
  insert into public.participants (play_id, player_id, team_id) values (play, p_ana, red), (play, p_bruno, blue), (play, p_carla, red);

  insert into public.plays (session_id, game_id, play_mode, duration_minutes, created_by)
  values ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'competitive', 95, '22222222-2222-4222-8222-222222222222')
  returning id into play;
  insert into public.play_expansions (play_id, expansion_id) select play, id from public.expansions where name = 'Navegantes';
  insert into public.participants (play_id, player_id, score, rank) values
    (play, p_ana, 9, 2), (play, p_bruno, 10, 1), (play, p_carla, 10, 1);
end;
$$;

-- A planned Session with an open Poll. It is created after the Plays above, so it stays planned.
insert into public.sessions (id, date, place, created_by)
values ('b0000000-0000-4000-8000-000000000005', private.today() + 6, 'Casa de Ana', '11111111-1111-4111-8111-111111111111');
insert into public.session_attendees (session_id, player_id)
select 'b0000000-0000-4000-8000-000000000005', id from public.players where display_name in ('Ana', 'Bruno', 'Carla');
insert into public.polls (id, session_id, allow_veto, created_by)
values ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005', true, '11111111-1111-4111-8111-111111111111');
insert into public.candidates (id, poll_id, game_id, added_by)
select v.id, 'd0000000-0000-4000-8000-000000000001', v.game_id, p.id
from (values
  ('e0000000-0000-4000-8000-000000000001'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Ana'),
  ('e0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000006'::uuid, 'Bruno'),
  ('e0000000-0000-4000-8000-000000000003'::uuid, 'a0000000-0000-4000-8000-000000000004'::uuid, 'Carla')
) as v (id, game_id, name)
join public.players p on p.display_name = v.name;
insert into public.approvals (candidate_id, player_id)
select v.candidate_id, p.id
from (values
  ('e0000000-0000-4000-8000-000000000001'::uuid, 'Bruno'), ('e0000000-0000-4000-8000-000000000001'::uuid, 'Carla'),
  ('e0000000-0000-4000-8000-000000000002'::uuid, 'Bruno'), ('e0000000-0000-4000-8000-000000000003'::uuid, 'Carla')
) as v (candidate_id, name)
join public.players p on p.display_name = v.name;
