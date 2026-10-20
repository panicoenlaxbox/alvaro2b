-- An optional name for a Session ("Sábado de mazmorreo"), shown next to its date.
alter table public.sessions add column name text check (length(name) <= 60);

grant insert (name), update (name) on public.sessions to authenticated;
