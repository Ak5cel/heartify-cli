const axios = require("axios");
const userTokenStore = require("../config/userTokenStore");
const globals = require("../config/globals");
const { getUserProfile } = require("./db");

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

exports.createPlaylist = async (playlistName, visibility = "public") => {
  const accessToken = await userTokenStore.getAccessToken();
  const { id: userId } = getUserProfile();

  const response = await spotifyApi.post(
    `/users/${userId}/playlists`,
    {
      name: playlistName,
      public: visibility === "private" ? false : true,
    },
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  const playlistId = response.data.id;
  const playlistURI = response.data.uri;

  return { playlistId, playlistURI };
};

exports.addTracksToPlaylist = async (playlistId, trackIDs) => {
  const accessToken = await userTokenStore.getAccessToken();

  const trackURIs = trackIDs.map((trackID) => `spotify:track:${trackID}`);

  try {
    const response = await spotifyApi.post(
      `/playlists/${playlistId}/tracks`,
      {
        uris: trackURIs,
      },
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.log(err.response.data);
  }
};
