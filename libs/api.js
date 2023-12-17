const axios = require("axios");
const userTokenStore = require("../config/userTokenStore");
const globals = require("../config/globals");

const spotifyApi = axios.create({
  baseURL: "https://api.spotify.com/v1",
});

async function* fetchLikedSongs() {
  const accessToken = await userTokenStore.getAccessToken();

  let url = `${globals.SPOTIFY_SAVED_TRACKS}?offset=0&limit=50`;

  do {
    const response = await axios.get(url, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
    url = response.data.next;
    total = response.data.total;

    for (let track of response.data.items) {
      yield [track, total];
    }
  } while (url);
}

module.exports.fetchLikedSongs = fetchLikedSongs;

exports.getUpstreamState = async () => {
  const accessToken = await userTokenStore.getAccessToken();

  const response = await spotifyApi.get("/me/tracks", {
    params: {
      limit: 1,
    },
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const lastSavedTrack = response.data.items[0];

  return {
    lastAddedAt: lastSavedTrack.added_at,
    numSavedTracks: response.data.total,
  };
};

exports.getUserProfile = async () => {
  const accessToken = await userTokenStore.getAccessToken();

  const response = await spotifyApi.get("/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  return response.data;
};
