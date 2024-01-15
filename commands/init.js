const http = require("http");
const pc = require("picocolors");
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
const {
  fetchAllLikedSongs,
  fetchGenres,
  fetchAllAudioFeatures,
} = require("./common");

exports.init = async () => {
  const version = require("../package.json").version;
  console.log(pc.dim(`Heartify v${version}\n`));

  const authURL = generateSpotifyAuthURL();

  console.log(
    "Visit this link to authorise access to your library and complete the setup.\nThese permissions can be revoked at any time from your account settings on Spotify. \n"
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
      pc.red(
        "Error: there seems to be a state mismatch. This could happen if the link expires, or if Spotify encounters an error. Please try again later."
      )
    );
    process.exit(1);
  } else if (error) {
    console.log(pc.bgRed(`ERROR: ${error}`));
    if (error === "access_denied") {
      console.log(pc.red("Init failed - permissions denied."));
    } else {
      console.log(
        pc.red("We received an error from Spotify. Please try again later.")
      );
    }
    process.exit(1);
  }

  console.log(
    "\nReceived permissions, you can now safely close the browser tab/window."
  );

  process.stdout.write("Completing authentication...");

  const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

  process.stdout.write(pc.green("Done.\n"));

  process.stdout.write("Initialising local database...");
  dropAllTables();
  setupDB();
  createUserWithTokens(accessToken, refreshToken);

  const { id: spotify_id, display_name } = await fetchUserProfile();
  saveUserProfile(spotify_id, display_name);

  console.log(pc.green("Done.\n"));

  await fetchAllLikedSongs();
  await fetchGenres();
  await fetchAllAudioFeatures();

  console.log(pc.green("Init complete.\n"));
  console.log(
    `Run \`heartify export --help\` to see how to make your first playlist!`
  );
};
