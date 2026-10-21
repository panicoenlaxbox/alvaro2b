-- An optional start time for a Session, in the group's time zone like its date.
alter table public.sessions add column start_time time;

grant insert (start_time), update (start_time) on public.sessions to authenticated;
