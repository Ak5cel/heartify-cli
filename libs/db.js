const Database = require("better-sqlite3");
const { getUpstreamState } = require("./api");

const db = new Database(`${__dirname}/../_db.sqlite`, { fileMustExist: true });

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
  const upstreamState = await getUpstreamState();
  const dbState = this.getLastFetchState();

  return (
    upstreamState.lastAddedAt === dbState.lastAddedAt &&
    upstreamState.numSavedTracks === dbState.numFetchedTracks
  );
};
