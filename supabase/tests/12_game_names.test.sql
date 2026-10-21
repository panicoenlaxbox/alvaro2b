-- Game names are unique, and Expansion names are unique within their Game, ignoring case and surrounding spaces.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into public.games (name) values ('Rumbo'), ('Faro');

select throws_ok($$insert into public.games (name) values (' rumbo ')$$, '23505', null, 'a second Game cannot take the same name');
select throws_ok($$update public.games set name = 'RUMBO' where name = 'Faro'$$, '23505', null, 'a Game cannot be renamed to a taken name');
select lives_ok($$update public.games set retired_at = now() where name = 'Rumbo'$$, 'a Game can be retired');
select throws_ok($$insert into public.games (name) values ('Rumbo')$$, '23505', null, 'a retired Game still holds its name');

insert into public.expansions (game_id, name) select id, 'Mareas' from public.games where name = 'Rumbo';

select throws_ok(
  $$insert into public.expansions (game_id, name) select id, 'mareas ' from public.games where name = 'Rumbo'$$,
  '23505', null, 'a Game cannot have two Expansions with the same name'
);
select lives_ok(
  $$insert into public.expansions (game_id, name) select id, 'Mareas' from public.games where name = 'Faro'$$,
  'another Game may have an Expansion with that name'
);

select * from finish();
rollback;
