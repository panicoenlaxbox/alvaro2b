-- Lifecycle (PRD 4): a Session dated today is now born planned, like a future one, so "held"
-- is set by hand ("¡Empezamos!") or by the first Play. Only past Sessions are born held.
create or replace function private.session_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.status := case when new.date >= private.today() then 'planned' else 'held' end;
  elsif new.status is distinct from old.status
        and not (old.status = 'planned' and new.status in ('held', 'cancelled')) then
    raise exception 'Invalid Session status change' using errcode = '23514';
  end if;
  return new;
end;
$$;
