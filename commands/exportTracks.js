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

exports.exportTracks = async (playlistName, options) => {
  if (!checkTablesExist()) {
    console.log("Database setup incomplete. Please run `heartify init`.");
    process.exit(1);
  }

  console.log("Checking for changes upstream...");
  const isUpToDate = await checkIsDBUpToDate();
  if (isUpToDate) {
    console.log("Everything up to date.");
  } else {
    console.log("Clearing previous data");
    clearRecords();

    // fetch liked songs
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

  let { addedFrom, addedTo, year, genre, filter } = options;
  if (year) {
    addedFrom = year.addedFrom;
    addedTo = year.addedTo;
  }

  // add songs to playlist
  let count = 0;
  for await (let trackIDs of getFetchedTracks({
    addedFrom,
    addedTo,
    genre,
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
  console.log(`Export done.`);

  console.log(
    `Find the new playlist in your Spotify libary, or by searching for the uri: \n\n\t${playlistURI}\n\nin the Spotify desktop client.`
  );
};

const reFetchLikedSongs = async () => {
  console.log("Fetching Liked songs");

  let count = 0;
  for await (let [savedTrackObj, total] of fetchLikedSongs()) {
    saveTrack(savedTrackObj);

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

const fetchGenres = async () => {
  console.log("Fetching genre data...");

  let count = 0;
  for await (let artistIDs of getFetchedArtists()) {
    const artists = await fetchArtists(artistIDs);
    const genreData = artists.map((artist) => {
      return { artistID: artist.id, genres: artist.genres };
    });

    batchSaveGenres(genreData);

    count += artistIDs.length;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Adding genres for [${count}] artists...`);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Done.\n`);
};

const fetchAllAudioFeatures = async () => {
  console.log("Fetching audio features...");

  let count = 0;
  for await (let trackIDs of getFetchedTracks({}, 100)) {
    const audioFeatures = await fetchAudioFeatures(trackIDs);
    const trackFeatures = audioFeatures.map((featuresObj) => {
      return { trackID: featuresObj.id, audioFeatures: featuresObj };
    });

    batchSaveAudioFeatures(trackFeatures);

    count += trackIDs.length;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Fetching audio features for [${count}] songs...`);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Done.\n`);
};
