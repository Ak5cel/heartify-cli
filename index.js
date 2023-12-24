#! /usr/bin/env node

const { program, Option } = require("commander");
const { init } = require("./commands/init");
const { exportTracks } = require("./commands/exportTracks");
const {
  parseDateFrom,
  parseDateTo,
  parseYear,
} = require("./utils/dateTimeParsers");

program
  .command("init")
  .description(
    "Initial setup. Login and authorize Heartify to access your Spotify account."
  )
  .action(init);

program
  .command("export")
  .description("export liked songs to a new public/private playlist")
  .argument(
    "<playlist_name>",
    "name of the new playlist. If it contains multiple words, wrap in single/double quotes like 'my playlist name'"
  )
  .argument("[visibility]", "playlist visibility - public|private", "public")
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
  .action(exportTracks);

program.parse();
