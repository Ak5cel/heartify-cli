const { faker } = require("@faker-js/faker/locale/en");

exports.generateTrack = () => {
  const album = {};
  const artists = [];
  const duration_ms = faker.number.int();
  const explicit = faker.datatype.boolean();
  const id = faker.string.nanoid();
  const name = faker.music.songName();
  const popularity = faker.number.int(100);
  const type = "track";
  const uri = `spotify:track:${id}`;

  return {
    album,
    artists,
    duration_ms,
    explicit,
    id,
    name,
    popularity,
    type,
    uri,
  };
};

exports.generateTracks = (n) => {
  let tracks = [];

  for (let i = 0; i < n; i++) {
    const newTrack = this.generateTrack();

    tracks.push(newTrack);
  }

  return tracks;
};

exports.generateSavedTracks = (n) => {
  let savedTracks = [];
  const tracks = this.generateTracks(n);

  for (const track of tracks) {
    const added_at = faker.date.past({ years: 15 }).toJSON();

    savedTracks.push({ added_at, track });
  }

  return savedTracks;
};
