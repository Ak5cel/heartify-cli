const { createPlaylist, addTracksToPlaylist } = require("../libs/api");
const {
  clearRecords,
  checkIsDBUpToDate,
  getFetchedTracks,
  checkTablesExist,
} = require("../libs/db");
const {
  fetchAllLikedSongs,
  fetchGenres,
  fetchAllAudioFeatures,
} = require("./common");
const pc = require("picocolors");

exports.exportTracks = async (playlistName, options) => {
  if (!checkTablesExist()) {
    console.log(
      pc.yellow("Database setup incomplete. Please run `heartify init`.")
    );
    process.exit(1);
  }

  console.log("Checking for changes upstream...");
  const isUpToDate = await checkIsDBUpToDate();
  if (isUpToDate) {
    console.log("Everything up to date.");
  } else {
    console.log("Changes detected. Updating data.\n");
    clearRecords();
    await fetchAllLikedSongs();
    await fetchGenres();
    await fetchAllAudioFeatures();
  }

  // make new playlist
  const { playlistId, playlistURI } = await createPlaylist(
    playlistName,
    options.onProfile ? true : false
  );
  console.log(`\nCreated new playlist '${playlistName}'.`);

  let { addedFrom, addedTo, year, filter } = options;
  if (year) {
    addedFrom = year.addedFrom;
    addedTo = year.addedTo;
  }

  // add songs to playlist
  let count = 0;
  for await (let trackIDs of getFetchedTracks({
    addedFrom,
    addedTo,
    filter,
  })) {
    await addTracksToPlaylist(playlistId, trackIDs);

    count += trackIDs.length;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Adding [${count}] songs...`);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Added ${count} songs. \n`);
  console.log(pc.green("Export complete."));

  const playlistLocation = options.onProfile
    ? "on your Spotify profile"
    : "in your Spotify library";

  console.log(
    `Find the new playlist ${playlistLocation}, or by searching for the uri:`
  );
  console.log(`\n\n\t${playlistURI}\n\n`);
  console.log("in the Spotify desktop client.");
};
