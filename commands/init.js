const http = require("http");
const { generateSpotifyAuthURL, listenForAuthCode } = require("../libs/auth");
const app = require("../app");

exports.init = async () => {
  console.log("Hello! Welcome to heartify 💜");

  const authURL = generateSpotifyAuthURL();

  console.log(
    "Visit this link to authorize access to your library and complete the setup. These permissions can be revoked at any time from your account settings on Spotify. \n"
  );
  console.log(authURL);

  const tempServer = http.createServer(app);
  tempServer.listen(9090, () => {
    console.log("Listening...");
  });
  const { code, state, error } = await listenForAuthCode(app);

  // console.log(code, "<-- auth code received!!");
  // console.log(state, "<-- state code received!!");

  tempServer.close();

  console.log("You can now safely close the browser tab/window...");
};
