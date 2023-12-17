const config = {
  SPOTIFY_CLIENT_ID: "7bcaae5e99d54f378d1c34a0a9ae015f",
  SPOTIFY_SAVED_TRACKS: "https://api.spotify.com/v1/me/tracks",
  scopes: [
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-modify",
    "user-library-read",
    "user-read-private",
  ],
  redirect_uri: "http://localhost:9090/callback",
};

module.exports = config;
