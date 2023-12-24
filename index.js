#! /usr/bin/env node

const { program, InvalidArgumentError } = require("commander");
const { init } = require("./commands/init");
const { exportTracks } = require("./commands/exportTracks");
const { DateTime } = require("luxon");

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
  .action(exportTracks);

program.parse();

function parseDateFrom(dateStr, dummyPrevious) {
  const parsedDateLocal = DateTime.fromISO(dateStr);

  if (!parsedDateLocal.isValid) {
    throw new InvalidArgumentError(`Reason: ${parsedDateLocal.invalidReason}`);
  }

  const currentDateLocal = DateTime.now();
  if (parsedDateLocal > currentDateLocal) {
    throw new InvalidArgumentError(`Date should be in the past.`);
  }

  // convert the DateTime obj to the start of the day in
  // the user's local time. Then convert it to an ISO 8601 formatted
  // string in UTC to compare against results from the Spotify Web API
  // which are returned as ISO 8601 UTC strings
  return parsedDateLocal.startOf("day").toUTC().toISO();
}

function parseDateTo(dateStr, dummyPrevious) {
  const parsedDateLocal = DateTime.fromISO(dateStr);

  if (!parsedDateLocal.isValid) {
    throw new InvalidArgumentError(`Reason: ${parsedDateLocal.invalidReason}`);
  }

  const currentDateLocal = DateTime.now();
  if (parsedDateLocal > currentDateLocal) {
    throw new InvalidArgumentError(`Date should be in the past.`);
  }

  // convert the DateTime obj to the end of the day in
  // the user's local time. Then convert it to an ISO 8601 formatted
  // string in UTC to compare against results from the Spotify Web API
  // which are returned as ISO 8601 UTC strings
  return parsedDateLocal.endOf("day").toUTC().toISO();
}
