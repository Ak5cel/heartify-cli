const fs = require("fs/promises");
const { fetchLikedSongs } = require("../libs/api");
const { saveTrack, clearRecords } = require("../libs/db");

exports.exportTracks = async (playlistName, visibility) => {
  console.log("Clearing previous data");
  clearRecords();

  // fetch liked songs
  console.log("Fetching Liked songs");

  let count = 0;
  for await (let [song, total] of fetchLikedSongs()) {
    saveTrack(song);

    count++;

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Fetching [${count}/${total}] songs...`);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Fetched ${count} songs.\n`);

  console.log("Done.");

  // make new playlist
  // add songs to playlist
};
