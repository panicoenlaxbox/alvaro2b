-- Polls: Candidates, Approvals and Vetoes (PRD 6).

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  allow_veto boolean not null default false,
  closes_at timestamptz,
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index polls_created_by_idx on public.polls (created_by);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  added_by uuid references public.players (id) on delete set null default private.current_player_id(),
  -- Set by the Poll's creator to break ties or settle the result.
  chosen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (poll_id, game_id)
);

create index candidates_game_id_idx on public.candidates (game_id);
create index candidates_added_by_idx on public.candidates (added_by);

create table public.approvals (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade default private.current_player_id(),
  created_at timestamptz not null default now(),
  primary key (candidate_id, player_id)
);

create index approvals_player_id_idx on public.approvals (player_id);

-- One Veto per Member and Poll, when the Poll allows them.
create table public.vetoes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade default private.current_player_id(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, player_id)
);

create index vetoes_player_id_idx on public.vetoes (player_id);
create index vetoes_candidate_id_idx on public.vetoes (candidate_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function private.poll_is_open(poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.polls p
    where p.id = poll_id and p.closed_at is null and (p.closes_at is null or p.closes_at > now())
  );
$$;

create function private.candidate_poll_is_open(candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.poll_is_open((select c.poll_id from public.candidates c where c.id = candidate_id));
$$;

create function private.poll_allows_veto(poll_id uuid, candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.polls p join public.candidates c on c.poll_id = p.id
    where p.id = poll_id and c.id = candidate_id and p.allow_veto
  );
$$;

create function private.is_poll_creator(poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.polls p where p.id = poll_id and p.created_by = (select auth.uid()));
$$;

revoke all on function private.poll_is_open(uuid) from public;
revoke all on function private.candidate_poll_is_open(uuid) from public;
revoke all on function private.poll_allows_veto(uuid, uuid) from public;
revoke all on function private.is_poll_creator(uuid) from public;
grant execute on function private.poll_is_open(uuid) to authenticated;
grant execute on function private.candidate_poll_is_open(uuid) to authenticated;
grant execute on function private.poll_allows_veto(uuid, uuid) to authenticated;
grant execute on function private.is_poll_creator(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies and grants
-- ---------------------------------------------------------------------------

alter table public.polls enable row level security;
alter table public.candidates enable row level security;
alter table public.approvals enable row level security;
alter table public.vetoes enable row level security;

-- A Poll always belongs to a planned Session.
create policy "Members read polls" on public.polls
  for select to authenticated using ((select private.is_member()));
create policy "Members open polls on planned sessions" on public.polls
  for insert to authenticated with check ((select private.is_member()) and private.session_is_planned(session_id));
create policy "Creator or Admin manage polls" on public.polls
  for update to authenticated
  using ((select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin())))
  with check ((select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin())));
create policy "Creator or Admin delete polls" on public.polls
  for delete to authenticated
  using ((select private.is_member()) and (created_by = (select auth.uid()) or (select private.is_admin())));

create policy "Members read candidates" on public.candidates
  for select to authenticated using ((select private.is_member()));
create policy "Members propose candidates while open" on public.candidates
  for insert to authenticated
  with check (added_by = (select private.current_player_id()) and private.poll_is_open(poll_id));
create policy "Creator or Admin choose candidates" on public.candidates
  for update to authenticated
  using (private.is_poll_creator(poll_id) or (select private.is_admin()))
  with check (private.is_poll_creator(poll_id) or (select private.is_admin()));
create policy "Proposer, creator or Admin withdraw candidates while open" on public.candidates
  for delete to authenticated
  using (
    private.poll_is_open(poll_id)
    and (added_by = (select private.current_player_id()) or private.is_poll_creator(poll_id) or (select private.is_admin()))
  );

create policy "Members read approvals" on public.approvals
  for select to authenticated using ((select private.is_member()));
create policy "Members approve while open" on public.approvals
  for insert to authenticated
  with check (player_id = (select private.current_player_id()) and private.candidate_poll_is_open(candidate_id));
create policy "Members withdraw approvals while open" on public.approvals
  for delete to authenticated
  using (player_id = (select private.current_player_id()) and private.candidate_poll_is_open(candidate_id));

create policy "Members read vetoes" on public.vetoes
  for select to authenticated using ((select private.is_member()));
create policy "Members veto while open" on public.vetoes
  for insert to authenticated
  with check (
    player_id = (select private.current_player_id())
    and private.poll_is_open(poll_id)
    and private.poll_allows_veto(poll_id, candidate_id)
  );
create policy "Members change their veto while open" on public.vetoes
  for update to authenticated
  using (player_id = (select private.current_player_id()) and private.poll_is_open(poll_id))
  with check (
    player_id = (select private.current_player_id())
    and private.poll_is_open(poll_id)
    and private.poll_allows_veto(poll_id, candidate_id)
  );
create policy "Members withdraw their veto while open" on public.vetoes
  for delete to authenticated
  using (player_id = (select private.current_player_id()) and private.poll_is_open(poll_id));

grant select, delete on public.polls to authenticated;
grant insert (session_id, allow_veto, closes_at) on public.polls to authenticated;
grant update (allow_veto, closes_at, closed_at) on public.polls to authenticated;

grant select, delete on public.candidates to authenticated;
grant insert (poll_id, game_id, added_by) on public.candidates to authenticated;
grant update (chosen) on public.candidates to authenticated;

grant select, delete on public.approvals to authenticated;
grant insert (candidate_id, player_id) on public.approvals to authenticated;

grant select, delete on public.vetoes to authenticated;
grant insert (poll_id, player_id, candidate_id) on public.vetoes to authenticated;
grant update (poll_id, player_id, candidate_id) on public.vetoes to authenticated;
