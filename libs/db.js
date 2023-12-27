const Database = require("better-sqlite3");

const db = new Database(`${__dirname}/../_db.sqlite`);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

exports.createUserWithTokens = (accessToken, refreshToken) => {
  const insertUser = db.prepare(`
    INSERT INTO user
      (access_token, refresh_token)
    VALUES
      (?, ?)
  `);

  insertUser.run(accessToken, refreshToken);
};

exports.saveUserProfile = (spotify_id, display_name) => {
  const { id } = this.getUserProfile();

  const insertUser = db.prepare(`
    UPDATE user
    SET spotify_id=?,
        display_name=?
    WHERE id=?
  `);

  insertUser.run(spotify_id, display_name, id);
};

exports.getUserProfile = () => {
  return db.prepare(`SELECT id, spotify_id, display_name FROM user`).get();
};

exports.setUserTokens = (accessToken, refreshToken) => {
  const { spotify_id } = this.getUserProfile();

  const stmt = db.prepare(`
    UPDATE user 
    SET access_token=?, 
        refresh_token=?, 
    WHERE spotify_id=?
  `);

  stmt.run(accessToken, refreshToken, spotify_id);
};

exports.getUserTokens = () => {
  return db.prepare("SELECT access_token, refresh_token FROM user").get();
};

exports.getAccessToken = () => {
  return db.prepare("SELECT access_token FROM user").get();
};

exports.getRefreshToken = () => {
  return db.prepare("SELECT refresh_token FROM user").get();
};

exports.clearRecords = db.transaction(() => {
  db.prepare("DELETE FROM track_artist").run();
  db.prepare(`DELETE FROM track;`).run();
  db.prepare("DELETE FROM artist_genre").run();
  db.prepare("DELETE FROM genre").run();
  db.prepare("DELETE FROM artist").run();
  db.prepare(`DELETE FROM album;`).run();
});

exports.saveTrack = db.transaction((savedTrackObj) => {
  const { added_at, track } = savedTrackObj;

  const insertAlbum = db.prepare(`
    INSERT OR IGNORE INTO album 
      (id, name, release_date)
    VALUES
      (?, ?, ?)
  `);

  const album = track.album;
  insertAlbum.run(album.id, album.name, album.release_date);

  const insertTrack = db.prepare(`
    INSERT OR IGNORE INTO track 
      (id, added_at, name, duration_ms, explicit, popularity, album_id)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrack.run(
    track.id,
    added_at,
    track.name,
    track.duration_ms,
    track.explicit ? 1 : 0,
    track.popularity,
    album.id
  );

  const insertArtist = db.prepare(`
    INSERT OR IGNORE INTO artist 
      (id, name)
    VALUES
      (?, ?)
  `);

  const insertTrackArtist = db.prepare(`
    INSERT OR IGNORE INTO track_artist 
      (track_id, artist_id)
    VALUES
      (?, ?)
  `);

  for (const artist of track.artists) {
    insertArtist.run(artist.id, artist.name);
    insertTrackArtist.run(track.id, artist.id);
  }
});

exports.saveArtistGenres = db.transaction((artistID, genres) => {
  const insertGenre = db.prepare(`
    INSERT OR IGNORE INTO genre
      (name)
    VALUES
      (?)
  `);

  const insertArtistGenre = db.prepare(`
    INSERT INTO artist_genre
      (artist_id, genre_name)
    VALUES
      (?, ?)
  `);

  for (const genre of genres) {
    insertGenre.run(genre);
    insertArtistGenre.run(artistID, genre);
  }
});

exports.batchSaveGenres = db.transaction((genreData) => {
  for ({ artistID, genres } of genreData) {
    if (genres.length) {
      this.saveArtistGenres(artistID, genres);
    }
  }
});

exports.getLastFetchState = () => {
  const lastAddedAt = db
    .prepare(`SELECT MAX(added_at) AS val FROM track`)
    .get().val;

  const numFetchedTracks = db
    .prepare("SELECT COUNT(*) AS val FROM track")
    .get().val;

  return { lastAddedAt, numFetchedTracks };
};

exports.checkIsDBUpToDate = async () => {
  const { fetchUpstreamState } = require("./api");
  const upstreamState = await fetchUpstreamState();
  const dbState = this.getLastFetchState();

  return (
    upstreamState.lastAddedAt === dbState.lastAddedAt &&
    upstreamState.numSavedTracks === dbState.numFetchedTracks
  );
};

function* getFetchedTracks({ addedFrom, addedTo, genre }, n = 100) {
  console.log("looking for genre", genre);
  let queryStr = `
    SELECT id as id
    FROM track JOIN track_artist
      ON track.id = track_artist.track_id
    JOIN artist_genre
      ON track_artist.artist_id = artist_genre.artist_id
  `;

  const filters = [];

  if (addedFrom) {
    filters.push("added_at >= @addedFrom ");
  }

  if (addedTo) {
    filters.push("added_at <= @addedTo ");
  }

  if (genre) {
    filters.push("genre_name = @genre ");
  }

  if (filters.length) {
    queryStr += "WHERE " + filters.join(" AND ");
  }

  // execute the query once at this point (before sort or limit)
  // to get the total number of tracks to be added.
  // This will be used to limit the execution of the generator loop below
  const numResults = db
    .prepare(queryStr)
    .all({ addedFrom, addedTo, genre }).length;

  queryStr += `ORDER BY added_at DESC LIMIT ${n} OFFSET @offset`;

  const stmt = db.prepare(queryStr);

  for (let offset = 0; offset < numResults; offset += n) {
    const rows = stmt.raw().all({ addedFrom, addedTo, genre, offset }).flat();

    yield rows;
  }
}
module.exports.getFetchedTracks = getFetchedTracks;

function* getFetchedArtists() {
  const numArtists = db.prepare("SELECT COUNT(*) AS val FROM artist").get().val;

  const stmt = db.prepare("SELECT id FROM artist LIMIT 50 OFFSET @offset");

  for (let offset = 0; offset < numArtists; offset += 50) {
    const artistIDs = stmt.raw().all({ offset }).flat();

    yield artistIDs;
  }
}
module.exports.getFetchedArtists = getFetchedArtists;
