-- Game attachments: files and links, added and deleted by any Member.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- Two files owned by Bruno: one still attached, one orphaned.
insert into storage.objects (bucket_id, name, owner_id) values
  ('attachments', 'games/a0000000-0000-4000-8000-000000000004/kept.pdf', '22222222-2222-4222-8222-222222222222'),
  ('attachments', 'games/a0000000-0000-4000-8000-000000000004/orphan.pdf', '22222222-2222-4222-8222-222222222222');
insert into public.game_attachments (game_id, kind, path, file_name, size_bytes, created_by)
values ('a0000000-0000-4000-8000-000000000004', 'file', 'games/a0000000-0000-4000-8000-000000000004/kept.pdf', 'kept.pdf', 10, '22222222-2222-4222-8222-222222222222');

set local role authenticated;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla
-- The Storage API sets this before deleting; RLS still decides which rows go.
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id = 'attachments';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'attachments'), 0,
  'any Member deletes attached and orphaned files'
);

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
select lives_ok(
  $$insert into public.game_attachments (game_id, kind, url)
    values ('a0000000-0000-4000-8000-000000000004', 'link', 'https://example.com/calculator')$$,
  'a Member attaches a link to a Game'
);
select throws_ok(
  $$insert into public.game_attachments (game_id, kind, url)
    values ('a0000000-0000-4000-8000-000000000004', 'link', 'javascript:alert(1)')$$,
  '23514', null, 'links must be http or https'
);
select lives_ok(
  $$insert into public.game_attachments (game_id, kind, path, file_name, size_bytes)
    values ('a0000000-0000-4000-8000-000000000004', 'file', 'games/a0000000-0000-4000-8000-000000000004/faq.pdf', 'faq.pdf', 1000)$$,
  'a Member attaches a file to a Game'
);
select throws_ok(
  $$insert into public.game_attachments (game_id, kind, url, path, file_name, size_bytes)
    values ('a0000000-0000-4000-8000-000000000004', 'file', 'https://example.com', null, 'x.pdf', 10)$$,
  '23514', null, 'a file needs a path and no URL'
);

select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla
select is(
  (select count(*)::int from public.game_attachments where game_id = 'a0000000-0000-4000-8000-000000000004'),
  3, 'Members see every attachment'
);
delete from public.game_attachments where game_id = 'a0000000-0000-4000-8000-000000000004';
select is(
  (select count(*)::int from public.game_attachments where game_id = 'a0000000-0000-4000-8000-000000000004'),
  0, 'another Member deletes them'
);

select * from finish();
rollback;
