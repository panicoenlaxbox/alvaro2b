-- Guest names are unique, ignoring case and surrounding spaces; Members are not bound by it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into public.players (display_name) values ('Fede');

select throws_ok($$insert into public.players (display_name) values (' fede ')$$, '23505', null, 'a second Guest cannot take the same name');
select lives_ok($$insert into public.players (display_name) values ('Gael')$$, 'another name is fine');
select throws_ok($$update public.players set display_name = 'FEDE' where display_name = 'Gael'$$, '23505', null, 'a Guest cannot be renamed to a taken name');
select lives_ok(
  $$update public.players set display_name = 'Fede' where user_id = '33333333-3333-4333-8333-333333333333'$$,
  'a Member may share a Guest''s name'
);

select * from finish();
rollback;
