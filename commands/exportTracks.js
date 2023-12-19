const fs = require("fs/promises");
const {
  fetchLikedSongs,
  createPlaylist,
  addTracksToPlaylist,
} = require("../libs/api");
const {
  saveTrack,
  clearRecords,
  checkIsDBUpToDate,
  getUserProfile,
  getFetchedTracks,
} = require("../libs/db");

exports.exportTracks = async (playlistName, visibility) => {
  console.log("Checking for changes upstream...");
  const isUpToDate = await checkIsDBUpToDate();
  if (isUpToDate) {
    console.log("Everything up to date.");
  } else {
    console.log("Clearing previous data");
    clearRecords();

    // fetch liked songs
    await reFetchLikedSongs();
  }

  // make new playlist
  const { id: userId } = getUserProfile();
  const { playlistId, playlistURI } = await createPlaylist(
    playlistName,
    visibility
  );
  console.log(`\nCreated new playlist '${playlistName}'.`);

  // add songs to playlist
  let count = 0;
  for await (let trackIDs of getFetchedTracks()) {
    await addTracksToPlaylist(playlistId, trackIDs);

    count += trackIDs.length;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Adding [${count}] songs...`);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Added ${count} songs. \n`);
  console.log(`Export done.`);

  console.log(
    `Find the new playlist in your Spotify libary, or by searching for the uri: \n\n\t${playlistURI}\n\nin the Spotify desktop client.`
  );
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
