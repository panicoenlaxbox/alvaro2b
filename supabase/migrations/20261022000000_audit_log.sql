-- Audit log (PRD: Admin): one Audit entry per create, update or delete that a Member makes on the
-- group's main data. Only triggers write it, so no write escapes it and nobody can forge the author;
-- only the Admin reads it, and nobody edits or deletes it.
--
-- Kept deliberately simple:
--   * Only the main tables have a trigger. Child rows (Participants, Teams, Owners, tags,
--     Candidates…) count as a change of their parent when the form also saves the parent row.
--   * Writes caused by another trigger (a Participant joining the Session) are skipped, and so are
--     foreign key cascades, whose parent is already gone: deleting a Session leaves one entry, not
--     one per Attendee.
--   * Writes without a signed-in user (sign-up triggers, seeds, the keep-alive cron) are skipped.
--   * No diff: a label copied at the time keeps the entry readable after the row is gone.

create type public.audit_action as enum ('create', 'update', 'delete');

create type public.audit_kind as enum (
  'game', 'expansion', 'rating', 'attachment', 'session', 'attendee', 'play', 'poll', 'photo', 'player', 'email'
);

create table public.audit_entries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- The Player of the signed-in Member who made the change.
  actor_id uuid references public.players (id) on delete set null,
  action public.audit_action not null,
  kind public.audit_kind not null,
  -- The Game, Session, Play, Poll, Photo or Player whose page shows the change, when there is one.
  ref_id uuid,
  label text not null
);

create index audit_entries_created_at_idx on public.audit_entries (created_at desc);
create index audit_entries_actor_id_idx on public.audit_entries (actor_id);

alter table public.audit_entries enable row level security;

create policy "Admin reads the audit log" on public.audit_entries
  for select to authenticated using ((select private.is_admin()));

grant select on public.audit_entries to authenticated;

create function private.session_label(session_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(s.name || ' · ', '') || to_char(s.date, 'DD/MM/YYYY') from public.sessions s where s.id = session_id;
$$;

create function private.game_name(game_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select g.name from public.games g where g.id = game_id;
$$;

create function private.player_name(player_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select p.display_name from public.players p where p.id = player_id;
$$;

revoke all on function private.session_label(uuid) from public;
revoke all on function private.game_name(uuid) from public;
revoke all on function private.player_name(uuid) from public;

create function private.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record := case when tg_op = 'DELETE' then old else new end;
  v_kind public.audit_kind;
  v_ref uuid;
  v_label text;
begin
  if (select auth.uid()) is null or pg_trigger_depth() > 1 then
    return null;
  end if;

  case tg_table_name
    when 'games' then
      v_kind := 'game'; v_ref := r.id; v_label := r.name;
    when 'expansions' then
      v_kind := 'expansion'; v_ref := r.game_id; v_label := private.game_name(r.game_id) || ': ' || r.name;
    when 'ratings' then
      v_kind := 'rating'; v_ref := r.game_id; v_label := private.game_name(r.game_id) || ' (' || r.stars || '★)';
    when 'game_attachments' then
      v_kind := 'attachment'; v_ref := r.game_id;
      v_label := private.game_name(r.game_id) || ': ' || coalesce(r.file_name, r.url);
    when 'sessions' then
      v_kind := 'session'; v_ref := r.id; v_label := coalesce(r.name || ' · ', '') || to_char(r.date, 'DD/MM/YYYY');
    when 'session_attendees' then
      v_kind := 'attendee'; v_ref := r.session_id;
      v_label := private.player_name(r.player_id) || ' en ' || private.session_label(r.session_id)
        || case when tg_op <> 'DELETE' and r.maybe then ' (quizá)' else '' end;
    when 'plays' then
      v_kind := 'play'; v_ref := r.id;
      v_label := private.game_name(r.game_id) || ' en ' || private.session_label(r.session_id);
    when 'polls' then
      v_kind := 'poll'; v_ref := r.id; v_label := 'Votación de ' || private.session_label(r.session_id);
    when 'photos' then
      v_kind := 'photo'; v_ref := r.id; v_label := coalesce(nullif(btrim(r.caption), ''), 'Foto');
    when 'players' then
      v_kind := 'player'; v_ref := r.id; v_label := r.display_name;
    when 'allowed_emails' then
      v_kind := 'email'; v_ref := r.player_id; v_label := r.email::text;
  end case;

  -- A null label means the parent row is already gone: a cascade from a delete that is logged.
  if v_label is null then
    return null;
  end if;

  insert into public.audit_entries (actor_id, action, kind, ref_id, label)
  values (
    (select p.id from public.players p where p.user_id = (select auth.uid())),
    case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end::public.audit_action,
    v_kind,
    v_ref,
    v_label
  );
  return null;
end;
$$;

revoke all on function private.audit() from public;

create trigger audit after insert or update or delete on public.games
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.expansions
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.ratings
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.game_attachments
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.sessions
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.session_attendees
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.plays
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.polls
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.photos
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.players
  for each row execute function private.audit();
create trigger audit after insert or update or delete on public.allowed_emails
  for each row execute function private.audit();
