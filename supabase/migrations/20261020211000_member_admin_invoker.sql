-- The Member admin functions run with owner privileges, so they move to the private schema, which
-- the API does not expose. The API keeps two SECURITY INVOKER wrappers with the same signature.
alter function public.set_member_active(uuid, boolean) set schema private;
alter function public.delete_member(uuid) set schema private;

create function public.set_member_active(target uuid, active boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_member_active(target, active);
$$;

create function public.delete_member(target uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_member(target);
$$;

revoke all on function public.set_member_active(uuid, boolean) from public;
revoke all on function public.delete_member(uuid) from public;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;
grant execute on function public.delete_member(uuid) to authenticated;
