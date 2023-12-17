#! /usr/bin/env node

const { program } = require("commander");
const { init } = require("./commands/init");
const { exportTracks } = require("./commands/exportTracks");

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
  .action(exportTracks);

program.parse();
