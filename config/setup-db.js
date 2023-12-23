const Database = require("better-sqlite3");

exports.setupDB = () => {
  const db = new Database(`${__dirname}/../_db.sqlite`);

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY,
      spotify_id TEXT UNIQUE,
      display_name TEXT,
      access_token TEXT,
      refresh_token TEXT,
      valid_until integer
    );
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS album (
      id TEXT PRIMARY KEY,
      name TEXT,
      release_date TEXT
    );
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS track (
      id TEXT PRIMARY KEY,
      added_at TEXT,
      name TEXT,
      duration_ms TEXT,
      explicit BOOLEAN,
      popularity INTEGER,
      album_id TEXT,
      
      FOREIGN KEY (album_id) REFERENCES album(id)
    );
    `
  ).run();
};
