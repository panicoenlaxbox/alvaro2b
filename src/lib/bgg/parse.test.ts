import { describe, expect, it } from "vitest";
import { decodeDescription, parseSearch, parseThing, toGameDefaults } from "./parse";

// Trimmed-down responses in the shape of the XML API2.
const SEARCH = `<?xml version="1.0" encoding="utf-8"?>
<items total="2" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="230802">
    <name type="primary" value="Azul"/>
    <yearpublished value="2017"/>
  </item>
  <item type="boardgame" id="287954">
    <name type="alternate" value="Azul: Mini"/>
  </item>
</items>`;

const THING = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="30549">
    <image>https://cf.geekdo-images.com/pandemic.jpg</image>
    <name type="primary" sortindex="1" value="Pandemic"/>
    <name type="alternate" sortindex="1" value="Pandemia"/>
    <description>Work together &amp; save the world.&#10;&#10;Four diseases &quot;spread&quot;&#10;&#10;&#10;End.</description>
    <yearpublished value="2008"/>
    <minplayers value="2"/>
    <maxplayers value="4"/>
    <poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="100">
      <results numplayers="2">
        <result value="Best" numvotes="20"/><result value="Recommended" numvotes="50"/><result value="Not Recommended" numvotes="5"/>
      </results>
      <results numplayers="4">
        <result value="Best" numvotes="70"/><result value="Recommended" numvotes="20"/><result value="Not Recommended" numvotes="1"/>
      </results>
    </poll>
    <playingtime value="45"/>
    <minplaytime value="45"/>
    <maxplaytime value="45"/>
    <link type="boardgamecategory" id="1" value="Medical"/>
    <link type="boardgamemechanic" id="2023" value="Cooperative Game"/>
    <link type="boardgamemechanic" id="2001" value="Action Points"/>
    <statistics page="1">
      <ratings>
        <usersrated value="100000"/>
        <average value="7.58"/>
        <averageweight value="2.41"/>
      </ratings>
    </statistics>
  </item>
</items>`;

describe("parseSearch", () => {
  it("reads ids, names and years", () => {
    expect(parseSearch(SEARCH)).toEqual([
      { id: 230802, name: "Azul", year: 2017 },
      { id: 287954, name: "Azul: Mini", year: null },
    ]);
  });
  it("handles empty results", () => expect(parseSearch(`<items total="0"></items>`)).toEqual([]));
});

describe("parseThing", () => {
  const thing = parseThing(THING)!;

  it("reads the BGG info", () => {
    expect(thing).toMatchObject({
      id: 30549,
      name: "Pandemic",
      year: 2008,
      image: "https://cf.geekdo-images.com/pandemic.jpg",
      minPlayers: 2,
      maxPlayers: 4,
      minPlaytime: 45,
      maxPlaytime: 45,
      weight: 2.41,
      averageRating: 7.58,
      mechanics: ["Cooperative Game", "Action Points"],
      isExpansion: false,
    });
  });

  it("keeps only player counts voted Best", () => expect(thing.bestPlayers).toEqual(["4"]));
  it("decodes the description", () => expect(thing.description).toBe('Work together & save the world.\n\nFour diseases "spread"\n\nEnd.'));
  it("returns null without items", () => expect(parseThing(`<items></items>`)).toBeNull());
});

describe("toGameDefaults", () => {
  it("imports only our own fields and guesses the Play mode", () => {
    expect(toGameDefaults(parseThing(THING)!)).toEqual({
      name: "Pandemic",
      year: 2008,
      min_players: 2,
      max_players: 4,
      min_duration: 45,
      max_duration: 45,
      complexity: 2.4,
      default_play_mode: "cooperative",
      bgg_id: 30549,
      bgg_image_url: "https://cf.geekdo-images.com/pandemic.jpg",
    });
  });
});

describe("decodeDescription", () => {
  it("strips tags and numeric entities", () => expect(decodeDescription("Caf&#233; <b>bold</b>")).toBe("Café bold"));
});
