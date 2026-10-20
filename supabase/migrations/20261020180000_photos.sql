-- Photos: in a Session or in the general Album, with tagged Players and an optional Play (PRD 7).
-- Files live in the private media bucket (photos/ and photos/thumbs/), compressed in the browser.

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  -- Null means the general Album.
  session_id uuid references public.sessions (id) on delete restrict,
  play_id uuid references public.plays (id) on delete set null,
  path text not null unique check (path like 'photos/%'),
  thumb_path text not null unique check (thumb_path like 'photos/thumbs/%'),
  width smallint not null check (width > 0),
  height smallint not null check (height > 0),
  size_bytes integer not null check (size_bytes > 0),
  caption text check (length(caption) <= 500),
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index photos_session_id_idx on public.photos (session_id);
create index photos_play_id_idx on public.photos (play_id);
create index photos_uploaded_by_idx on public.photos (uploaded_by);
create index photos_created_at_idx on public.photos (created_at desc);

-- A tagged Play must belong to the Photo's Session.
create function private.photo_play_in_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.play_id is not null
     and not exists (select 1 from public.plays p where p.id = new.play_id and p.session_id is not distinct from new.session_id) then
    raise exception 'The Play is not in this Session' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.photo_play_in_session() from public;

create trigger photo_play_in_session before insert or update of play_id, session_id on public.photos
  for each row execute function private.photo_play_in_session();

create table public.photo_tags (
  photo_id uuid not null references public.photos (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (photo_id, player_id)
);

create index photo_tags_player_id_idx on public.photo_tags (player_id);

alter table public.photos enable row level security;
alter table public.photo_tags enable row level security;

create policy "Members read photos" on public.photos
  for select to authenticated using ((select private.is_member()));
create policy "Members upload photos" on public.photos
  for insert to authenticated with check ((select private.is_member()) and uploaded_by = (select auth.uid()));
create policy "Members edit photos" on public.photos
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Uploader or Admin delete photos" on public.photos
  for delete to authenticated using (
    (select private.is_member()) and (uploaded_by = (select auth.uid()) or (select private.is_admin()))
  );

create policy "Members read photo tags" on public.photo_tags
  for select to authenticated using ((select private.is_member()));
create policy "Members tag photos" on public.photo_tags
  for insert to authenticated with check ((select private.is_member()));
create policy "Members untag photos" on public.photo_tags
  for delete to authenticated using ((select private.is_member()));

grant select, delete on public.photos to authenticated;
grant insert (session_id, play_id, path, thumb_path, width, height, size_bytes, caption, uploaded_by) on public.photos to authenticated;
grant update (session_id, play_id, caption) on public.photos to authenticated;

grant select, delete on public.photo_tags to authenticated;
grant insert (photo_id, player_id) on public.photo_tags to authenticated;
