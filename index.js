#! /usr/bin/env node

const { program, Option } = require("commander");
const { init } = require("./commands/init");
const { exportTracks } = require("./commands/export-tracks");
const {
  parseDateFrom,
  parseDateTo,
  parseYear,
} = require("./utils/datetime-parsers");
const { parseFilters } = require("./utils/filter-parsers");
const { logout } = require("./commands/logout");
const { showGenres } = require("./commands/show-genres");

program.usage("[command] [options]");

program
  .command("init")
  .description(
    "Initial setup. Login and authorize Heartify to access your Spotify account."
  )
  .action(init);

program
  .command("export")
  .usage("<playlist_name> [options]")
  .description("Export liked songs to a new playlist")
  .argument(
    "<playlist_name>",
    "name of the new playlist. If it contains multiple words, wrap in single/double quotes like 'my playlist name'"
  )
  .option(
    "-p, --on-profile",
    "add playlist to profile. If omitted, the playlist will be public but not displayed on your profile"
  )
  .option(
    "-f, --added-from <YYYY-MM-DD>",
    "filter by songs you Liked from this date",
    parseDateFrom
  )
  .option(
    "-t, --added-to <YYYY-MM-DD>",
    "filter by songs you Liked up to (and including) this date",
    parseDateTo
  )
  .addOption(
    new Option(
      "-Y, --year <YYYY>",
      "filter songs by the year they were added to your Liked songs"
    )
      .conflicts(["addedFrom", "addedTo"])
      .argParser(parseYear)
  )
  .option(
    "--filter <field=value...>",
    `specify additional filters based on features of the track

  More on filters
  ===============
  - Value types
    1. Individual values 
      - 'field=value1'
      - accepted by all filter fields
    2. Ranges
      - 'field=[start,end]' or 'field=[start,]' or 'field=[,end]'
      - accepted by DateTime and Number fields only

  - String fields: 
      - Fields: artist, genre
      - Accepted value types: individual values only
  - Datetime fields:
      - Fields: release_date
      - Accepted value types: individual values and ranges
      - Valid formats - YYYY-MM-DD, YYYYMMDD. YYYY (parsed as YYYY-01-01)
  - Number fields:
      - Fields: danceability, energy, key, loudness, mode, speechiness, acousticness,
        instrumentalness, liveness, valence, tempo, duration_ms, time_signature
      - Accepted value types: individual values and ranges

  `,
    parseFilters,
    {}
  )
  .addHelpText(
    "after",
    `
Example calls:
  # export all iked songs to a playlist, add to profile (-p)
  $ heartify export 'My Liked Songs' -p

  # export just the songs liked in 2023
  $ heartify export 'Liked Songs 2023' -Y 2023

  # or the songs liked in any range of time
  $ heartify export 'Liked Songs, November 2023' -f 2023-11-01 -t 2023-11-30

  # see all genres identified
  $ heartify show-genres

  # make a genre-mix (replace <genre name> with a genre of your choice)
  $ heartify export 'My <genre name> mix' --filter 'genre=<genre name>'

  # make a multi-genre mix
  $ heartify export 'My multi-genre mix' --filter 'genre=<genre name>' 'genre=<another genre name>'

  # filter by properties of the track - like release date, audio features (tempo, key, etc)
  $ heartify export 'Liked Songs, 100-120bpm' --filter tempo=[100,120]
  `
  )
  .action(exportTracks);

program
  .command("show-genres")
  .description(
    "Show all genres detected in the liked songs in a tabular format. Use these to filter by genre when using the `--filter` option"
  )
  .action(showGenres);

program
  .command("logout")
  .description("Logout. Removes access tokens and all saved details")
  .action(logout);

program.version(require("./package.json").version);

process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

program.parse();
