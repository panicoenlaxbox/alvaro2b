-- Game attachments (PRD 3): files (an FAQ in PDF, a player aid…) and links (an online tool),
-- without description. Files live in the private attachments bucket under games/<game id>/.

create type public.attachment_kind as enum ('file', 'link');

create table public.game_attachments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  kind public.attachment_kind not null,
  url text check (url ~ '^https?://' and length(url) <= 2000),
  path text unique check (path like 'games/%' and length(path) <= 400),
  file_name text check (length(file_name) between 1 and 200),
  size_bytes integer check (size_bytes > 0),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (
    (kind = 'link' and url is not null and path is null and file_name is null and size_bytes is null)
    or (kind = 'file' and url is null and path is not null and file_name is not null and size_bytes is not null)
  )
);

create index game_attachments_game_id_idx on public.game_attachments (game_id);
create index game_attachments_created_by_idx on public.game_attachments (created_by);

alter table public.game_attachments enable row level security;

create policy "Members read attachments" on public.game_attachments
  for select to authenticated using ((select private.is_member()));
create policy "Members add attachments" on public.game_attachments
  for insert to authenticated with check ((select private.is_member()) and created_by = (select auth.uid()));
create policy "Author or Admin delete attachments" on public.game_attachments
  for delete to authenticated using (
    (select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin()))
  );

grant select, delete on public.game_attachments to authenticated;
grant insert (game_id, kind, url, path, file_name, size_bytes) on public.game_attachments to authenticated;

-- Storage: documents and images only (no HTML or scripts), up to 20 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 20971520, array[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet'
]);

create policy "Members read attachment files" on storage.objects
  for select to authenticated using (bucket_id = 'attachments' and (select private.is_member()));
create policy "Members upload attachment files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'attachments' and (select private.is_member()) and name like 'games/%'
  );

-- A file left without its attachment row (its Game was deleted) can be cleaned up by any Member.
create policy "Uploader or Admin delete attachment files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'attachments'
    and (select private.is_member())
    and (
      owner_id = (select auth.uid())::text
      or (select private.is_admin())
      or not exists (select 1 from public.game_attachments a where a.path = storage.objects.name)
    )
  );
