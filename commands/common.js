const {
  fetchLikedSongs,
  fetchArtists,
  fetchAudioFeatures,
} = require("../libs/api");
const {
  saveTrack,
  getFetchedArtists,
  batchSaveGenres,
  getFetchedTracks,
  batchSaveAudioFeatures,
} = require("../libs/db");
const pc = require("picocolors");

exports.fetchAllLikedSongs = async () => {
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

exports.fetchGenres = async () => {
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

exports.fetchAllAudioFeatures = async () => {
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
