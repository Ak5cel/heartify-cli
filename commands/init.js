const http = require("http");
const {
  generateSpotifyAuthURL,
  listenForAuthCode,
  exchangeCodeForTokens,
} = require("../libs/auth");
const app = require("../config/app");
const { setupDB } = require("../config/setup-db");
const { getUserProfile } = require("../libs/api");
const { saveUserProfile, setUserTokens } = require("../libs/db");

exports.init = async () => {
  console.log("Hello! Welcome to heartify 💜");

  const authURL = generateSpotifyAuthURL();

  console.log(
    "Visit this link to authorize access to your library and complete the setup. These permissions can be revoked at any time from your account settings on Spotify. \n"
  );
  console.log(authURL);

  const tempServer = http.createServer(app);
  tempServer.listen(9090);
  const { code, state, error } = await listenForAuthCode(app);

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

  const { accessToken, refreshToken, validUntil } = await exchangeCodeForTokens(
    code
  );

  console.log("Done.");

  console.log("Initialising local database...");
  setupDB();

  const { id, display_name } = await getUserProfile(accessToken);
  saveUserProfile(id, display_name);
  setUserTokens(accessToken, refreshToken, validUntil);

  console.log("Done.");
};
