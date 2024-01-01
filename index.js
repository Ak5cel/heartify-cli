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
  .option("--filter <name=value...>", "specify filters", parseFilters, {})
  .action(exportTracks);

program
  .command("logout")
  .description("Logout. Removes access tokens and all saved details")
  .action(logout);

process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

program.parse();
