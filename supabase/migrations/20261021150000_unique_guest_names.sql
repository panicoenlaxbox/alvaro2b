-- Two Guests cannot share a name (ignoring case and surrounding spaces): with no email to tell them
-- apart, the pickers would show the same name twice. Members may share one, as it comes from Google.
create unique index players_guest_name_key on public.players (lower(btrim(display_name))) where user_id is null;
