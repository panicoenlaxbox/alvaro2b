-- Two fixes to the baseline.
--
-- 1. game_attachments.created_by was the only reference to auth.users without "on delete set null",
--    so deleting a Member who had ever added an attachment failed as "The Member has history".
--    Attachments now keep their file and lose their creator, like every other created_by.
alter table public.game_attachments
  drop constraint game_attachments_created_by_fkey,
  add constraint game_attachments_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;

-- 2. The app no longer imports Games from BoardGameGeek, so Members never set bgg_image_url. Only the
--    initial Catalog (supabase/seed/catalog.sql, run in the SQL Editor) writes it. Without this, any
--    Member could point a Game's cover at an arbitrary URL.
revoke insert (bgg_image_url), update (bgg_image_url) on public.games from authenticated;

create or replace function public.save_game(game jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(game ->> 'id', '')::uuid;
  g public.games := jsonb_populate_record(null::public.games, game);
begin
  if v_id is null then
    insert into public.games (name, year, min_players, max_players, min_duration, max_duration, complexity,
                              default_play_mode, lower_score_wins, bgg_id, notes)
    values (g.name, g.year, g.min_players, g.max_players, g.min_duration, g.max_duration, g.complexity,
            coalesce(g.default_play_mode, 'competitive'), coalesce(g.lower_score_wins, false), g.bgg_id, g.notes)
    returning id into v_id;
  else
    update public.games set
      name = g.name, year = g.year, min_players = g.min_players, max_players = g.max_players,
      min_duration = g.min_duration, max_duration = g.max_duration, complexity = g.complexity,
      default_play_mode = coalesce(g.default_play_mode, 'competitive'),
      lower_score_wins = coalesce(g.lower_score_wins, false), bgg_id = g.bgg_id, notes = g.notes
    where id = v_id;
    if not found then
      raise exception 'Game not found' using errcode = 'P0002';
    end if;
  end if;

  perform public.set_game_owners(v_id, array(select jsonb_array_elements_text(coalesce(game -> 'owner_ids', '[]'))::uuid));
  return v_id;
end;
$$;
