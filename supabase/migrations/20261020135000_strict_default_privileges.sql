-- New objects in public get no privileges for the API roles. Every migration grants exactly what
-- it needs (CLAUDE.md). Without this, the local stack grants everything by default and the hosted
-- project still grants DELETE, TRUNCATE, REFERENCES and TRIGGER, so local tests could pass with
-- grants that production lacks.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;

-- Reset the tables created so far to their explicit grants.
revoke all on public.players, public.allowed_emails, public.keep_alive from anon, authenticated;

grant select, delete on public.players to authenticated;
grant insert (display_name, avatar_url) on public.players to authenticated;
grant update (display_name, avatar_url) on public.players to authenticated;

grant select, insert, delete on public.allowed_emails to authenticated;
grant update (is_admin, player_id) on public.allowed_emails to authenticated;

grant select on public.keep_alive to anon;
grant update (pinged_at) on public.keep_alive to anon;
