#! /usr/bin/env node

const { program } = require("commander");
const { init } = require("./commands/init");

program
  .command("init")
  .description(
    "Initial setup. Login and authorize Heartify to access your Spotify account."
  )
  .action(init);

program.parse();
