const Database = require("better-sqlite3");

const db = new Database(`${__dirname}/../_db.sqlite`);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

process.on("exit", () => {
  db.close();
  process.stdout.write("\n");
});

exports.checkTablesExist = db.transaction(() => {
  const val = db
    .prepare(
      `
        SELECT COUNT(*) as val 
        FROM sqlite_master 
        WHERE 
          type='table' AND 
          name IN ('user','album', 'artist', 'genre', 'artist_genre', 'track', 'track_artist')
      `
    )
    .get().val;

  return val === 7;
});

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

exports.dropAllTables = db.transaction(() => {
  db.prepare("DROP TABLE IF EXISTS track_artist").run();
  db.prepare(`DROP TABLE IF EXISTS track;`).run();
  db.prepare("DROP TABLE IF EXISTS artist_genre").run();
  db.prepare("DROP TABLE IF EXISTS genre").run();
  db.prepare("DROP TABLE IF EXISTS artist").run();
  db.prepare(`DROP TABLE IF EXISTS album;`).run();
  db.prepare(`DROP TABLE IF EXISTS user;`).run();
});

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

exports.saveTrackAudioFeatures = (trackID, audioFeatures) => {
  const features = [
    "danceability",
    "energy",
    "key",
    "loudness",
    "mode",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo",
    "time_signature",
  ];

  const fieldPairs = features.map((feature) => `${feature} = @${feature}`);
  const fields = fieldPairs.join(", ");

  const updateAudioFeatures = db.prepare(`
    UPDATE track
    SET 
      ${fields}
    WHERE
      id = @trackID
  `);

  updateAudioFeatures.run({ ...audioFeatures, trackID });
};

exports.batchSaveAudioFeatures = db.transaction((trackFeatures) => {
  for ({ trackID, audioFeatures } of trackFeatures) {
    if (audioFeatures) {
      this.saveTrackAudioFeatures(trackID, audioFeatures);
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

function* getFetchedTracks({ addedFrom, addedTo, filter }, n = 100) {
  let queryStr = `
    SELECT DISTINCT id
    FROM track LEFT JOIN track_artist
      ON track.id = track_artist.track_id
    LEFT JOIN artist_genre
      ON track_artist.artist_id = artist_genre.artist_id
  `;

  const filters = [];
  const filterValues = [];

  if (addedFrom) {
    filters.push("added_at >= @addedFrom ");
  }

  if (addedTo) {
    filters.push("added_at <= @addedTo ");
  }

  if (filter) {
    Object.keys(filter).forEach((field) => {
      const values = filter[field];

      if (field === "artist") {
        const mask = new Array(values.length).fill("?").join();
        filters.push(
          `track_artist.artist_id IN (SELECT id FROM artist WHERE artist.name IN (${mask})) `
        );
        filterValues.push(...values);
      } else if ((field = "genre")) {
        const mask = new Array(values.length).fill("?").join();
        filters.push(`genre_name IN (${mask}) `);
        filterValues.push(...values);
      } else if (field === "release_date") {
        values.forEach((pair) => {
          let filterStr = "track.album_id IN (SELECT id FROM album WHERE ";
          const ranges = [];
          if (pair.from) {
            ranges.push("release_date >= ? ");
            filterValues.push(pair.from);
          }

          if (pair.to) {
            ranges.push("release_date <= ? ");
            filterValues.push(pair.to);
          }

          filterStr += ranges.join(" AND ") + ")";
          filters.push(filterStr);
        });
      } else {
        values.map((value) => {
          if (typeof value === "object") {
            if (typeof value.from !== "undefined") {
              filters.push(`${field} >= ? `);
              filterValues.push(value.from);
            }

            if (typeof value.to !== "undefined") {
              filters.push(`${field} <= ? `);
              filterValues.push(value.to);
            }
          } else {
            filters.push(`${field} = ?`);
            filterValues.push(value);
          }
        });
      }
    });
  }

  if (filters.length) {
    queryStr += "WHERE " + filters.join(" AND ");
  }

  // execute the query once at this point (before sort or limit)
  // to get the total number of tracks to be added.
  // This will be used to limit the execution of the generator loop below
  const numResults = db
    .prepare(queryStr)
    .all({ addedFrom, addedTo }, filterValues).length;

  queryStr += `ORDER BY added_at DESC LIMIT ${n} OFFSET @offset`;

  console.log(queryStr);

  const stmt = db.prepare(queryStr);

  for (let offset = 0; offset < numResults; offset += n) {
    const rows = stmt
      .raw()
      .all({ addedFrom, addedTo, offset }, filterValues)
      .flat();

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
