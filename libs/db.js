const Database = require("better-sqlite3");

const db = new Database(`${__dirname}/../_db.sqlite`);

exports.createUserWithTokens = (accessToken, refreshToken, validUntil) => {
  const insertUser = db.prepare(`
    INSERT INTO user
      (access_token, refresh_token, valid_until)
    VALUES
      (?, ?, ?)
  `);

  insertUser.run(accessToken, refreshToken, validUntil);
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

exports.setUserTokens = (accessToken, refreshToken, validUntil) => {
  const { spotify_id } = this.getUserProfile();

  const stmt = db.prepare(`
    UPDATE user 
    SET access_token=?, 
        refresh_token=?, 
        valid_until=? 
    WHERE spotify_id=?
  `);

  stmt.run(accessToken, refreshToken, validUntil, spotify_id);
};

exports.getUserTokens = () => {
  return db
    .prepare("SELECT access_token, refresh_token, valid_until FROM user")
    .get();
};

exports.getAccessToken = () => {
  return db.prepare("SELECT access_token FROM user").get();
};

exports.getRefreshToken = () => {
  return db.prepare("SELECT refresh_token FROM user").get();
};

exports.getValidUntil = () => {
  return db.prepare("SELECT valid_until FROM user").get();
};

exports.clearRecords = db.transaction(() => {
  db.prepare(`DELETE FROM track;`).run();
  db.prepare(`DELETE FROM album;`);
});

exports.saveTrack = (savedTrackObj) => {
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
};

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
  const { getUpstreamState } = require("./api");
  const upstreamState = await getUpstreamState();
  const dbState = this.getLastFetchState();

  return (
    upstreamState.lastAddedAt === dbState.lastAddedAt &&
    upstreamState.numSavedTracks === dbState.numFetchedTracks
  );
};

function* getFetchedTracks() {
  const numFetchedTracks = db
    .prepare("SELECT COUNT(*) AS val FROM track")
    .get().val;

  const stmt = db.prepare(
    `SELECT id as id FROM track ORDER BY added_at DESC LIMIT 100 OFFSET ?`
  );

  for (let offset = 0; offset < numFetchedTracks; offset += 100) {
    const rows = stmt.raw().all(offset).flat();

    yield rows;
  }
}
module.exports.getFetchedTracks = getFetchedTracks;
