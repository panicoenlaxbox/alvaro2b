-- The group's initial Catalog: 34 Games and 5 Expansions, with the fields the app takes from
-- BoardGameGeek when adding a Game (src/lib/bgg/parse.ts, toGameDefaults). Data from BGG, October 2026.
--
-- Not fixture data, so it is not listed in supabase/config.toml [db.seed]: run it on demand with
-- `pnpm db:catalog` (local) or paste it into the SQL editor of the production project.
-- Safe to run again: Games and Expansions that already exist by name are left untouched.
-- No created_by, Owners, Ratings or notes: those are added from the app.

insert into public.games (bgg_id, name, year, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, bgg_image_url)
select g.bgg_id, g.name, g.year, g.min_p, g.max_p, g.min_d, g.max_d, g.cx, g.mode::public.play_mode, g.image
from (values
  (169786, 'Scythe', 2016, 1, 5, 115, 115, 3.5, 'competitive', 'https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BUZdA__original/img/HlDb9F365w0tSP8uD1vf1pfniQE=/0x0/filters:format(jpeg)/pic3163924.jpg'),
  (37111, 'Battlestar Galactica: The Board Game', 2008, 3, 6, 120, 180, 3.3, 'cooperative', 'https://cf.geekdo-images.com/5Q2w2rFJiFI_uV89KP6ECg__original/img/MYuRAKLRAGlIQTph2XKWjzqT7sQ=/0x0/filters:format(jpeg)/pic354500.jpg'),
  (246900, 'Eclipse: Second Dawn for the Galaxy', 2020, 2, 6, 60, 200, 3.7, 'competitive', 'https://cf.geekdo-images.com/Oh3kHw6lweg6ru71Q16h2Q__original/img/yW7d4RNfU1ndISCaPlfGYUyxnRU=/0x0/filters:format(jpeg)/pic5235277.jpg'),
  -- (72125, 'Eclipse: New Dawn for the Galaxy', 2011, 2, 6, 60, 180, 3.7, 'competitive', 'https://cf.geekdo-images.com/cnFppsVNOSTJ-W3APQFuTg__original/img/AbcjscBi-x3tVrsJsBhXq2RxLbc=/0x0/filters:format(jpeg)/pic1974056.jpg'),
  (167355, 'Nemesis', 2018, 1, 5, 90, 180, 3.5, 'cooperative', 'https://cf.geekdo-images.com/4KSmlm59w0GwLIlgDnJDAQ__original/img/f0VmAKrPrMRQOUcOJHekRvuysDE=/0x0/filters:format(png)/pic8211747.png'),
  (381248, 'Nemesis: Retaliation', 2025, 1, 5, 120, 180, 3.8, 'cooperative', 'https://cf.geekdo-images.com/bt-s6gbhhI46VSIgsxyOIw__original/img/xYe36FgPjJnSkBjIG3lryToA82I=/0x0/filters:format(jpeg)/pic7375234.jpg'),
  (310100, 'Nemesis: Lockdown', 2022, 1, 5, 90, 180, 3.9, 'cooperative', 'https://cf.geekdo-images.com/NEbmFFGhKwegIryUArgw6w__original/img/YCDNmHN9DiyAnjSvFRen1sjAug4=/0x0/filters:format(jpeg)/pic7110034.jpg'),
  (237182, 'Root', 2018, 2, 4, 60, 90, 3.8, 'competitive', 'https://cf.geekdo-images.com/JUAUWaVUzeBgzirhZNmHHw__original/img/E0s2LvtFA1L5YKk-_44D4u2VD2s=/0x0/filters:format(jpeg)/pic4254509.jpg'),
  (220308, 'Gaia Project', 2017, 1, 4, 60, 150, 4.4, 'competitive', 'https://cf.geekdo-images.com/hGWFm3hbMlCDsfCsauOQ4g__original/img/tjlflQtUPFiTpLpwk1NCVCS29Ic=/0x0/filters:format(png)/pic5375625.png'),
  (224517, 'Brass: Birmingham', 2018, 2, 4, 60, 120, 3.9, 'competitive', 'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__original/img/FpyxH41Y6_ROoePAilPNEhXnzO8=/0x0/filters:format(jpeg)/pic3490053.jpg'),
  -- (28720, 'Brass: Lancashire', 2007, 2, 4, 60, 120, 3.8, 'competitive', 'https://cf.geekdo-images.com/tHVtPzu82mBpeQbbZkV6EA__original/img/3ffdJj5Pz6HQrg09Kh8ecTen-TY=/0x0/filters:format(jpeg)/pic3469216.jpg'),
  (251247, 'Barrage', 2019, 1, 4, 90, 180, 4.1, 'competitive', 'https://cf.geekdo-images.com/jEPmWvvYpqkWrKOzqIHFsg__original/img/rkHKwkUqpQC7PAGG7n2gbrcQiUY=/0x0/filters:format(png)/pic4336469.png'),
  (187645, 'Star Wars: Rebellion', 2016, 2, 4, 180, 240, 3.8, 'team', 'https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__original/img/GKueTbkCk2Ramf6ai8mDj-BP6cI=/0x0/filters:format(jpeg)/pic4325841.jpg'),
  (271896, 'Star Wars: Outer Rim', 2019, 1, 4, 120, 180, 2.6, 'competitive', 'https://cf.geekdo-images.com/RjwAj6hw5aEMGvosEA12gw__original/img/jQUkqrDd0lOX6IRGq5Cbj1junL4=/0x0/filters:format(jpeg)/pic5879810.jpg'),
  (133848, 'Euphoria: Build a Better Dystopia', 2013, 2, 6, 60, 60, 3.1, 'competitive', 'https://cf.geekdo-images.com/aaEdtCTpdlDLTn_tuDuC0g__original/img/6mvmw0I7vDfcKSFg-g9E5F4GEgA=/0x0/filters:format(jpeg)/pic1615561.jpg'),
  (103343, 'A Game of Thrones: The Board Game (Second Edition)', 2011, 3, 6, 120, 240, 3.7, 'competitive', 'https://cf.geekdo-images.com/M_7UvwZvuxBVjxdadsa5AA__original/img/3tv6H7jX5T9rqwuI84YZKZDBGcw=/0x0/filters:format(jpeg)/pic1077906.jpg'),
  (233078, 'Twilight Imperium: Fourth Edition', 2017, 3, 6, 240, 480, 4.4, 'competitive', 'https://cf.geekdo-images.com/_Ppn5lssO5OaildSE-FgFA__original/img/kVpZ0Maa_LeQGWxOqsYKP3N4KUY=/0x0/filters:format(jpeg)/pic3727516.jpg'),
  (37904, 'Formula D', 2008, 2, 10, 60, 60, 2.0, 'competitive', 'https://cf.geekdo-images.com/ScuaQBHRYnsqrwSxSdEdIw__original/img/xqbaVS5XaicATFoKXZn12X1-k_8=/0x0/filters:format(jpeg)/pic519914.jpg'),
  (366013, 'Heat: Pedal to the Metal', 2022, 1, 6, 30, 60, 2.2, 'competitive', 'https://cf.geekdo-images.com/-vOrd4bOspibyohYExLqWg__original/img/iXU8a9WaVlwrkiEiOxWN06y9y5g=/0x0/filters:format(png)/pic6940449.png'),
  (150376, 'Dead of Winter: A Crossroads Game', 2014, 2, 5, 60, 120, 3.0, 'competitive', 'https://cf.geekdo-images.com/g4mV4BH-ZrhMUVgil-yV1A__original/img/NjrnSg1aeia8I4eETDU3I1Br7a8=/0x0/filters:format(jpeg)/pic3016500.jpg'),
  (340466, 'Unfathomable', 2021, 3, 6, 120, 240, 3.1, 'team', 'https://cf.geekdo-images.com/_kZDRdv3tONk9vTcA_OwSA__original/img/oEyl7gbuPch1ZM8H8e47XEOb_rs=/0x0/filters:format(png)/pic8317346.png'),
  (36218, 'Dominion', 2008, 2, 4, 30, 30, 2.3, 'competitive', 'https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__original/img/96COuakNiLRrjDLc1sM4Zxsw4WE=/0x0/filters:format(jpeg)/pic394356.jpg'),
  -- (209418, 'Dominion: Second Edition', 2016, 2, 4, 30, 30, 2.2, 'competitive', 'https://cf.geekdo-images.com/4dmyKfqQm_uxA1-chh4JeQ__original/img/5UxDHPldIiCb0uovIwzngR-jx5M=/0x0/filters:format(jpeg)/pic3187001.jpg'),
  (342942, 'Ark Nova', 2021, 1, 4, 90, 150, 3.8, 'competitive', 'https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__original/img/g4S18szTdrXCdIwVKzMKrZrYAcM=/0x0/filters:format(jpeg)/pic6293412.jpg'),
  (316554, 'Dune: Imperium', 2020, 1, 4, 60, 120, 3.1, 'competitive', 'https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__original/img/mZzaBAEEJpMlHWWmC0R6Su0OibQ=/0x0/filters:format(jpeg)/pic5666597.jpg'),
  -- (283355, 'Dune', 2019, 2, 6, 120, 180, 4.0, 'competitive', 'https://cf.geekdo-images.com/2fgPg6Be--w97zoycObUgg__original/img/7PyNxWs85_OKGOm_jYVFvPwAViE=/0x0/filters:format(jpeg)/pic4815198.jpg'),
  (436217, 'The Lord of the Rings: Fate of the Fellowship', 2025, 1, 5, 60, 150, 3.1, 'cooperative', 'https://cf.geekdo-images.com/scw36iBIad7l-rGzxPGcGg__original/img/JZKAg-ETtE7z3YbgSMPd242rCqE=/0x0/filters:format(png)/pic8662670.png'),
  (254127, 'Europa Universalis: The Price of Power', 2023, 1, 4, 90, 300, 4.7, 'competitive', 'https://cf.geekdo-images.com/orNF7D3hCHN3nj7Z3RauWw__original/img/iEYBt0ODVMWeizIyq_TuwqKUPEQ=/0x0/filters:format(jpeg)/pic4973943.jpg'),
  (174430, 'Gloomhaven', 2017, 1, 4, 60, 120, 3.9, 'cooperative', 'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/7d-lj5Gd1e8PFnD97LYFah2c45M=/0x0/filters:format(jpeg)/pic2437871.jpg'),
  (1513, 'The Republic of Rome', 1990, 1, 6, 300, 300, 4.4, 'competitive', 'https://cf.geekdo-images.com/1hw9kRfQg849_J5mjPHuBQ__original/img/2neiZgMUdbeliPtHUp-lSCfAOt0=/0x0/filters:format(jpeg)/pic487045.jpg'),
  -- (425789, 'The Republic of Rome: Remastered', 2025, 1, 6, 260, 720, null, 'competitive', 'https://cf.geekdo-images.com/B0IKoBpjC2Av7XEJ7uAeXw__original/img/aeSsC7tahJfjwpTcha-dMu7VDuQ=/0x0/filters:format(jpeg)/pic8417482.jpg'),
  (144189, 'Fire in the Lake', 2014, 1, 4, 180, 180, 4.2, 'competitive', 'https://cf.geekdo-images.com/08V8nzzLAr190Miv9GeitA__original/img/7gRe3HqaZPZPLNyKiBaq0EMbhU8=/0x0/filters:format(png)/pic2083738.png'),
  (349963, 'Age of Comics: The Golden Years', 2023, 1, 4, 50, 120, 2.6, 'competitive', 'https://cf.geekdo-images.com/lhVWWA7ovNofeOVcSSBMsw__original/img/54x7FHuCG9YlMJ4GguZiCkBzTg8=/0x0/filters:format(jpeg)/pic6886727.jpg'),
  (228341, 'Pulsar 2849', 2017, 2, 4, 60, 90, 3.3, 'competitive', 'https://cf.geekdo-images.com/6TOzhqw0BXNxbUZCl0k1sg__original/img/tj-4BHcZxjUmiJpMnPCxXF1g0YY=/0x0/filters:format(jpeg)/pic6285702.jpg'),
  (197376, 'Charterstone', 2017, 1, 6, 45, 75, 2.9, 'competitive', 'https://cf.geekdo-images.com/ToG_L1KA83024V5qHwfLbQ__original/img/h_c-3Fx9tUuuz9FSPZFW8AK22VI=/0x0/filters:format(png)/pic9706762.png'),
  (422780, 'Mistborn: The Deckbuilding Game', 2024, 1, 4, 30, 60, 2.7, 'cooperative', 'https://cf.geekdo-images.com/Fr_k9-uU3hEUnw_3s-UnZQ__original/img/XhMQVwHzTcQPTS_2cjIn_NdZJwM=/0x0/filters:format(png)/pic8290518.png'),
  (22827, 'StarCraft: The Board Game', 2007, 2, 6, 180, 240, 3.9, 'team', 'https://cf.geekdo-images.com/tXwlK5uyyxaMzXG65NZ3Xg__original/img/J5-KA7kHSx-6ln75ntNNy9OeBwA=/0x0/filters:format(jpeg)/pic265704.jpg'),
  (104710, 'Wiz-War (Eighth Edition)', 2012, 2, 4, 30, 60, 2.3, 'competitive', 'https://cf.geekdo-images.com/yXbWhfIuwKFJfPNg5SgPOQ__original/img/C-3SceTz2k75LaIYt3sQWl7g7lU=/0x0/filters:format(jpeg)/pic1222733.jpg'),
  (331106, 'The Witcher: Old World', 2023, 1, 5, 90, 150, 2.9, 'competitive', 'https://cf.geekdo-images.com/tQVVSXcmYLvAoI28cp-2Tg__original/img/0JwC_ndrsYO3hkawTSLpdf9huKc=/0x0/filters:format(jpeg)/pic5974859.jpg')
) as g (bgg_id, name, year, min_p, max_p, min_d, max_d, cx, mode, image)
on conflict ((lower(btrim(name)))) do nothing;

-- Each Expansion hangs from its base Game, found by BGG id.
insert into public.expansions (game_id, bgg_id, name, year)
select games.id, e.bgg_id, e.name, e.year
from (values
  (342942, 368966, 'Ark Nova: Marine Worlds', 2023),
  (316554, 342031, 'Dune: Imperium – Rise of Ix', 2022),
  (316554, 367466, 'Dune: Imperium – Immortality', 2022),
  (331106, 341023, 'The Witcher: Old World – Monster Trail', 2023),
  (331106, 340983, 'The Witcher: Old World – Wild Hunt', 2023)
  -- With Dune (283355) instead of Dune: Imperium:
  -- (283355, 296579, 'Dune: Ixians & Tleilaxu', 2020),
  -- (283355, 346083, 'Dune: CHOAM & Richese', 2022)
) as e (game_bgg_id, bgg_id, name, year)
join public.games on games.bgg_id = e.game_bgg_id
on conflict (game_id, (lower(btrim(name)))) do nothing;

-- To remove this Catalog again (local tests only; Expansions go with their Game):
-- delete from public.games where bgg_id in (169786, 37111, 246900, 167355, 381248, 310100, 237182, 220308, 224517, 251247, 187645, 271896, 133848, 103343, 233078, 37904, 366013, 150376, 340466, 36218, 342942, 316554, 436217, 254127, 174430, 1513, 144189, 349963, 228341, 197376, 422780, 22827, 104710, 331106);
