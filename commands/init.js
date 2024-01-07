const http = require("http");
const {
  generateSpotifyAuthURL,
  listenForAuthCode,
  exchangeCodeForTokens,
} = require("../libs/auth");
const { setupDB } = require("../config/setup-db");
const { fetchUserProfile } = require("../libs/api");
const {
  saveUserProfile,
  createUserWithTokens,
  dropAllTables,
} = require("../libs/db");

exports.init = async () => {
  console.log("Hello! Welcome to heartify 💜");

  const authURL = generateSpotifyAuthURL();

  console.log(
    "Visit this link to authorize access to your library and complete the setup. These permissions can be revoked at any time from your account settings on Spotify. \n"
  );
  console.log(authURL);

  // spin up a temporary server to listen on port 9090
  // wait for spotify to send data to the callback url
  // then close the server
  const tempServer = http.createServer();
  tempServer.listen(9090);

  const { code, state, error } = await listenForAuthCode(tempServer);

  tempServer.close();

  if (!state || state !== process.env.SPOTIFY_CLIENT_STATE) {
    console.log(
      "Error: there seems to be a state mismatch. This could happen if the link expires, or if Spotify encounters an error. Please try again later."
    );
    return;
  } else if (error) {
    console.log("Hmm.. something's gone wrong");
    console.log(`ERROR: ${error}`);
    console.log(
      "We received an error from Spotify. This happens if the user declines permissions or if Spotify encounters an error. Please try again later."
    );
    return;
  }

  console.log(
    "\nReceived permissions, you can now safely close the browser tab/window..."
  );

  console.log("Completing authentication...");

  const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

  console.log("Done.");

  console.log("Initialising local database...");
  dropAllTables();
  setupDB();
  createUserWithTokens(accessToken, refreshToken);

  const { id: spotify_id, display_name } = await fetchUserProfile();
  saveUserProfile(spotify_id, display_name);

  console.log("Done.");
};
