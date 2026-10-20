-- Photo rules: uploads in your name, tagged Play from the same Session, deletes by uploader or Admin.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

create temp table ids on commit drop as
select (select id from public.plays where session_id = 'b0000000-0000-4000-8000-000000000002' limit 1) as other_play;
grant select on ids to authenticated;

set local role authenticated;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333'); -- Carla

select throws_ok(
  $$insert into public.photos (path, thumb_path, width, height, size_bytes, uploaded_by)
    values ('photos/x.webp', 'photos/thumbs/x.webp', 10, 10, 100, '22222222-2222-4222-8222-222222222222')$$,
  '42501', null, 'nobody uploads in someone else''s name'
);

insert into public.photos (session_id, path, thumb_path, width, height, size_bytes, uploaded_by)
values ('b0000000-0000-4000-8000-000000000001', 'photos/t.webp', 'photos/thumbs/t.webp', 10, 10, 100, '33333333-3333-4333-8333-333333333333');

select throws_ok(
  $$update public.photos set play_id = (select other_play from ids) where path = 'photos/t.webp'$$,
  'The Play is not in this Session', 'the tagged Play must be from the Photo''s Session'
);

select pg_temp.act_as('22222222-2222-4222-8222-222222222222'); -- Bruno
with d as (delete from public.photos where path = 'photos/t.webp' returning 1)
select is(count(*)::int, 0, 'another Member cannot delete the Photo') from d;
select lives_ok($$update public.photos set caption = 'Hola' where path = 'photos/t.webp'$$, 'any Member edits the caption');

reset role;
set local role anon;
select is((select count(*)::int from storage.objects where bucket_id = 'media'), 0, 'signed-out visitors see no media');

select * from finish();
rollback;
