-- Fictional sample data on top of 01_members.sql: a Guest, the Catalog, Sessions, Plays and a Poll.
-- Never put real names, emails or photos here (public repository).

-- A Guest, without an account.
insert into public.players (display_name, created_by)
values ('Dani', '11111111-1111-4111-8111-111111111111');

-- Catalog. Game names are public titles; owners are the fictional Members above.
insert into public.games (id, name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, lower_score_wins, created_by)
select g.id, g.name, g.year, g.min_p, g.max_p, g.min_d, g.max_d, g.cx, g.mode::public.play_mode, g.lower, '11111111-1111-4111-8111-111111111111'
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'Azul', 2017, 2, 4, 30, 45, 1.8, 'competitive', false, 'Ana'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Pandemic', 2008, 2, 4, 45, 45, 2.4, 'cooperative', false, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'Codenames', 2015, 2, 8, 15, 15, 1.3, 'team', false, 'Carla'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'Catan', 1995, 3, 4, 60, 120, 2.3, 'competitive', false, 'Ana'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'Golf', 2020, 2, 6, 20, 20, 1.1, 'competitive', true, null),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'Wingspan', 2019, 1, 5, 40, 70, 2.5, 'competitive', false, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 'The Resistance', 2009, 5, 10, 30, 30, 1.6, 'team', false, 'Carla')
) as g (id, name, year, min_p, max_p, min_d, max_d, cx, mode, lower, owner);

-- Catan was bought between Ana and Bruno; Golf belongs to nobody.
insert into public.game_owners (game_id, player_id)
select o.game_id, p.id
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'Ana'), ('a0000000-0000-4000-8000-000000000002'::uuid, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'Carla'), ('a0000000-0000-4000-8000-000000000004'::uuid, 'Ana'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'Bruno'), ('a0000000-0000-4000-8000-000000000006'::uuid, 'Bruno'),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 'Carla')
) as o (game_id, name)
join public.players p on p.display_name = o.name;

insert into public.expansions (id, game_id, name, created_by)
values ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'Navegantes', '11111111-1111-4111-8111-111111111111');

insert into public.expansion_owners (expansion_id, player_id)
select 'f0000000-0000-4000-8000-000000000001', id from public.players where display_name = 'Ana';

insert into public.ratings (game_id, player_id, stars)
select r.game_id, p.id, r.stars
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'Ana', 5), ('a0000000-0000-4000-8000-000000000001'::uuid, 'Bruno', 4),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Carla', 4), ('a0000000-0000-4000-8000-000000000004'::uuid, 'Bruno', 2),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'Ana', 5), ('a0000000-0000-4000-8000-000000000006'::uuid, 'Carla', 3)
) as r (game_id, name, stars)
join public.players p on p.display_name = r.name;

-- Sessions relative to the reset date, so the seed always has past and upcoming ones, one past without Plays.
insert into public.sessions (id, date, place, created_by) values
  ('b0000000-0000-4000-8000-000000000001', private.today() - 30, 'Casa de Ana', '11111111-1111-4111-8111-111111111111'),
  ('b0000000-0000-4000-8000-000000000002', private.today() - 9, 'Bar La Partida', '22222222-2222-4222-8222-222222222222'),
  ('b0000000-0000-4000-8000-000000000003', private.today() + 4, 'Casa de Carla', '33333333-3333-4333-8333-333333333333'),
  ('b0000000-0000-4000-8000-000000000004', private.today() - 2, null, '11111111-1111-4111-8111-111111111111');
update public.sessions set start_time = '18:00' where id = 'b0000000-0000-4000-8000-000000000003';

insert into public.session_attendees (session_id, player_id)
select s.session_id, p.id
from (values
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'Ana'), ('b0000000-0000-4000-8000-000000000001'::uuid, 'Bruno'),
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'Carla'), ('b0000000-0000-4000-8000-000000000001'::uuid, 'Dani'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'Ana'), ('b0000000-0000-4000-8000-000000000002'::uuid, 'Bruno'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'Carla')
) as s (session_id, name)
join public.players p on p.display_name = s.name;

insert into public.session_attendees (session_id, player_id, maybe)
select 'b0000000-0000-4000-8000-000000000003', p.id, r.maybe
from (values ('Carla', false), ('Bruno', true)) as r (name, maybe)
join public.players p on p.display_name = r.name;

-- Plays in the past Sessions, one per Play mode plus a tie.
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

-- An upcoming Session with an open Poll.
insert into public.sessions (id, date, place, created_by)
values ('b0000000-0000-4000-8000-000000000005', private.today() + 6, 'Casa de Ana', '11111111-1111-4111-8111-111111111111');
insert into public.session_attendees (session_id, player_id)
select 'b0000000-0000-4000-8000-000000000005', id from public.players where display_name in ('Ana', 'Bruno', 'Carla');
insert into public.polls (id, session_id, created_by)
values ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111');
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
