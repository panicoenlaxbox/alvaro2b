-- Any Member deletes and manages anything (PRD 0): Games, Expansions, attachments, Sessions, Plays,
-- Photos and Polls. Only the Admin manages who signs in and the Players. Personal answers (Ratings,
-- approvals, Vetoes) stay each Member's own.

drop policy "Author or Admin delete games" on public.games;
create policy "Members delete games" on public.games
  for delete to authenticated using ((select private.is_member()));

drop policy "Author or Admin delete expansions" on public.expansions;
create policy "Members delete expansions" on public.expansions
  for delete to authenticated using ((select private.is_member()));

drop policy "Author or Admin delete attachments" on public.game_attachments;
create policy "Members delete attachments" on public.game_attachments
  for delete to authenticated using ((select private.is_member()));

drop policy "Uploader or Admin delete attachment files" on storage.objects;
create policy "Members delete attachment files" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments' and (select private.is_member()));

drop policy "Uploader or Admin delete media" on storage.objects;
create policy "Members delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select private.is_member()));

drop policy "Author or Admin delete sessions" on public.sessions;
create policy "Members delete sessions" on public.sessions
  for delete to authenticated using ((select private.is_member()));

drop policy "Author or Admin delete plays" on public.plays;
create policy "Members delete plays" on public.plays
  for delete to authenticated using ((select private.is_member()));

drop policy "Uploader or Admin delete photos" on public.photos;
create policy "Members delete photos" on public.photos
  for delete to authenticated using ((select private.is_member()));

drop policy "Creator or Admin manage polls" on public.polls;
create policy "Members manage polls" on public.polls
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));

drop policy "Creator or Admin delete polls" on public.polls;
create policy "Members delete polls" on public.polls
  for delete to authenticated using ((select private.is_member()));

drop policy "Creator or Admin choose candidates" on public.candidates;
create policy "Members choose candidates" on public.candidates
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));

drop policy "Proposer, creator or Admin withdraw candidates while open" on public.candidates;
create policy "Members withdraw candidates while open" on public.candidates
  for delete to authenticated using ((select private.is_member()) and private.poll_is_open(poll_id));

drop function private.is_poll_creator(uuid);
