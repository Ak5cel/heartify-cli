const fs = require("fs/promises");
const { fetchLikedSongs } = require("../libs/api");
const { saveTrack, clearRecords, checkIsDBUpToDate } = require("../libs/db");

exports.exportTracks = async (playlistName, visibility) => {
  console.log("Checking for changes upstream...");
  const isUpToDate = checkIsDBUpToDate();
  if (isUpToDate) {
    console.log("Everything up to date.");
  } else {
    console.log("Clearing previous data");
    clearRecords();

    // fetch liked songs
    await reFetchLikedSongs();
  }

  // make new playlist
  // add songs to playlist
};

const reFetchLikedSongs = async () => {
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
};
