-- Polls lose Vetoes (PRD 6): Members only say which Candidates they fancy.

drop table public.vetoes;
drop function private.poll_allows_veto(uuid, uuid);
alter table public.polls drop column allow_veto;
