const axios = require("axios");
const globals = require("../config/globals");
const { getUserProfile, getAccessToken, setUserTokens } = require("./db");
const { refreshTokens } = require("./auth");

class RootApiService {
  constructor(baseURL) {
    const options = {
      baseURL: baseURL || "",
    };

    this.instance = axios.create(options);

    this.instance.interceptors.request.use(
      (config) => {
        const { access_token } = getAccessToken();
        if (access_token) {
          config.headers.Authorization = "Bearer " + access_token;
        }

        return config;
      },
      (err) => {
        return Promise.reject(err);
      }
    );

    this.instance.interceptors.response.use(
      (res) => {
        return res;
      },
      async (err) => {
        const originalConfig = err.config;

        if (err.response) {
          // Access token expired, refresh tokens then retry
          if (err.response.status === 401 && !originalConfig._retry) {
            originalConfig._retry = true;

            try {
              const tokens = await refreshTokens();
              const { accessToken, refreshToken } = tokens;
              setUserTokens(accessToken, refreshToken);
              this.instance.defaults.headers.common["Authorization"] =
                "Bearer " + accessToken;

              return this.instance(originalConfig);
            } catch (_err) {
              if (_err.response && _err.response.data) {
                return Promise.reject(_err.response.data);
              }

              return Promise.reject(_err);
            }
          }

          if (err.response.status === 429) {
            const delay = err.response.headers["retry-after"] | 1;
            const delay_ms = delay * 1000;

            console.log("waiting");
            const delayRetry = new Promise((resolve) => {
              setTimeout(() => {
                console.log("retrying the request", originalConfig.url);
                resolve();
              }, delay_ms);
            });

            return delayRetry.then(() => this.instance(originalConfig));
          }

          if (err.response.status === 403 && err.response.data) {
            return Promise.reject(err.response.data);
          }
        }

        return Promise.reject(err);
      }
    );
  }

  getInstance() {
    return this.instance;
  }
}

class SpotifyWebApiService extends RootApiService {
  constructor() {
    const baseURL = "https://api.spotify.com/v1";
    super(baseURL);
  }
}

const baseApi = new RootApiService().getInstance();
const spotifyApi = new SpotifyWebApiService().getInstance();

async function* fetchLikedSongs() {
  let url = `${globals.SPOTIFY_SAVED_TRACKS}?offset=0&limit=50`;

  do {
    const response = await baseApi.get(url);
    url = response.data.next;
    total = response.data.total;

    for (let track of response.data.items) {
      yield [track, total];
    }
  } while (url);
}

module.exports.fetchLikedSongs = fetchLikedSongs;

exports.fetchUpstreamState = async () => {
  const response = await spotifyApi.get("/me/tracks", {
    params: {
      limit: 1,
    },
  });

  const lastSavedTrack = response.data.items[0];

  return {
    lastAddedAt: lastSavedTrack.added_at,
    numSavedTracks: response.data.total,
  };
};

exports.fetchUserProfile = async () => {
  const response = await spotifyApi.get("/me");
  return response.data;
};

exports.fetchArtists = async (artistIDs) => {
  const response = await spotifyApi.get(`/artists`, {
    params: {
      ids: artistIDs.join(","),
    },
  });
  return response.data.artists;
};

exports.fetchAudioFeatures = async (trackIDs) => {
  const response = await spotifyApi.get("/audio-features", {
    params: {
      ids: trackIDs.join(","),
    },
  });

  return response.data.audio_features;
};

exports.createPlaylist = async (playlistName, onProfile = false) => {
  const { spotify_id } = getUserProfile();

  try {
    const response = await spotifyApi.post(`/users/${spotify_id}/playlists`, {
      name: playlistName,
      public: onProfile,
    });

    const playlistId = response.data.id;
    const playlistURI = response.data.uri;

    return { playlistId, playlistURI };
  } catch (err) {
    if (err.response && err.response.data) {
      console.log(err.response.data);
    } else if (err.request) {
      console.log(err.request);
    } else {
      console.log(err);
    }
  }
};

exports.addTracksToPlaylist = async (playlistId, trackIDs) => {
  const trackURIs = trackIDs.map((trackID) => `spotify:track:${trackID}`);

  try {
    const response = await spotifyApi.post(`/playlists/${playlistId}/tracks`, {
      uris: trackURIs,
    });

    return response.data;
  } catch (err) {
    console.log(err.response.data);
  }
};
