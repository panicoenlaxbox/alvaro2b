-- Two Games cannot share a name, and neither can two Expansions of the same Game (ignoring case and
-- surrounding spaces). Retired ones count too: bring the old one back instead of adding it again.
create unique index games_name_key on public.games (lower(btrim(name)));
create unique index expansions_game_name_key on public.expansions (game_id, lower(btrim(name)));
