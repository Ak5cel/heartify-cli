const {
  fetchLikedSongs,
  createPlaylist,
  addTracksToPlaylist,
  fetchArtists,
  fetchAudioFeatures,
} = require("../libs/api");
const {
  saveTrack,
  clearRecords,
  checkIsDBUpToDate,
  getFetchedTracks,
  batchSaveGenres,
  getFetchedArtists,
  batchSaveAudioFeatures,
  checkTablesExist,
} = require("../libs/db");
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
    await reFetchLikedSongs();
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

const reFetchLikedSongs = async () => {
  const header = "Fetching Liked songs...";
  process.stdout.write(header);

  let count = 0;
  for await (let [savedTrackObj, total] of fetchLikedSongs()) {
    saveTrack(savedTrackObj);

    count++;

    process.stdout.cursorTo(header.length);
    process.stdout.clearLine(+1);
    process.stdout.write(pc.dim(`[${count}/${total}]`));
  }

  process.stdout.cursorTo(header.length);
  process.stdout.clearLine(+1);
  console.log(pc.green("Done."));
};

const fetchGenres = async () => {
  const header = "Fetching genre data...";
  process.stdout.write(header);

  let count = 0;
  for await (let artistIDs of getFetchedArtists()) {
    const artists = await fetchArtists(artistIDs);
    const genreData = artists.map((artist) => {
      return { artistID: artist.id, genres: artist.genres };
    });

    batchSaveGenres(genreData);

    count += artistIDs.length;
    process.stdout.cursorTo(header.length);
    process.stdout.clearLine(+1);
    process.stdout.write(pc.dim(`[${count}] artists`));
  }

  process.stdout.cursorTo(header.length);
  process.stdout.clearLine(+1);
  process.stdout.write(pc.green(`Done.\n`));
};

const fetchAllAudioFeatures = async () => {
  const header = "Fetching audio features...";
  process.stdout.write(header);

  let count = 0;
  for await (let trackIDs of getFetchedTracks({}, 100)) {
    const audioFeatures = await fetchAudioFeatures(trackIDs);
    const trackFeatures = audioFeatures.map((featuresObj) => {
      return { trackID: featuresObj.id, audioFeatures: featuresObj };
    });

    batchSaveAudioFeatures(trackFeatures);

    count += trackIDs.length;
    process.stdout.cursorTo(header.length);
    process.stdout.clearLine(+1);
    process.stdout.write(pc.dim(`[${count}] songs`));
  }

  process.stdout.cursorTo(header.length);
  process.stdout.clearLine(+1);
  process.stdout.write(pc.green(`Done.\n`));
};
