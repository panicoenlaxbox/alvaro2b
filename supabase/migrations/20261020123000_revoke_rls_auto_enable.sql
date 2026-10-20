-- The hosted project creates public.rls_auto_enable() for the "automatic RLS" setting. It is an
-- event trigger function, so API roles never need to call it; revoking EXECUTE removes it from the
-- Data API (advisor lints 0028 and 0029). It does not exist in the local stack.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
