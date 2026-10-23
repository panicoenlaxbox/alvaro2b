-- Rules every migration must keep, checked across the whole schema: RLS and policies on every
-- table, nothing for anon except the keep-alive, and a fixed search_path on SECURITY DEFINER code.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  array(select c.relname::text from pg_class c
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity
        order by 1),
  '{}'::text[], 'every public table has Row Level Security'
);

select is(
  array(select c.relname::text from pg_class c
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
          and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
        order by 1),
  '{}'::text[], 'every public table has at least one policy'
);

select is(
  array(select distinct table_name::text from information_schema.role_table_grants
        where grantee = 'anon' and table_schema = 'public' and table_name <> 'keep_alive'
        union
        select distinct table_name::text from information_schema.column_privileges
        where grantee = 'anon' and table_schema = 'public' and table_name <> 'keep_alive'
        order by 1),
  '{}'::text[], 'anon has no privileges on any table but keep_alive'
);

select is(
  array(select p.oid::regprocedure::text from pg_proc p
        where p.prosecdef and p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
          and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')
        order by 1),
  '{}'::text[], 'every SECURITY DEFINER function fixes its search_path'
);

select * from finish();
rollback;
