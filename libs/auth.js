const crypto = require("crypto");
const { base64Encode, sha256 } = require("../utils/encoders");
const globals = require("../config/globals");
const { default: axios } = require("axios");
const { getRefreshToken } = require("./db");

exports.generateSpotifyAuthURL = () => {
  const baseURL = "https://accounts.spotify.com/authorize";

  const codeVerifier = base64Encode(crypto.randomBytes(32));
  process.env.CODE_VERIFIER = codeVerifier;

  const codeChallenge = base64Encode(sha256(codeVerifier));

  const state = crypto.randomBytes(8).toString("hex");
  process.env.SPOTIFY_CLIENT_STATE = state;

  const params = new URLSearchParams({
    client_id: globals.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: globals.redirect_uri,
    state: state,
    scope: globals.scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  const fullAuthURL = baseURL + "?" + params.toString();
  return fullAuthURL;
};

exports.listenForAuthCode = (server) => {
  return new Promise((resolve, reject) => {
    server.on("request", (req, res) => {
      const { searchParams } = new URL(`http://${req.url}`);

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      resolve({ code, state, error });
      res.statusCode = 200;
      res.end();
    });
  });
};

exports.exchangeCodeForTokens = (authCode) => {
  const endpoint = "https://accounts.spotify.com/api/token";

  const postBody = {
    grant_type: "authorization_code",
    code: authCode,
    client_id: globals.SPOTIFY_CLIENT_ID,
    redirect_uri: globals.redirect_uri,
    code_verifier: process.env.CODE_VERIFIER,
  };

  const postConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  return axios.post(endpoint, postBody, postConfig).then((response) => {
    const { access_token, refresh_token } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
    };
  });
};

exports.refreshTokens = async () => {
  const endpoint = "https://accounts.spotify.com/api/token";

  const { refresh_token: refreshToken } = getRefreshToken();

  const postBody = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: globals.SPOTIFY_CLIENT_ID,
  };

  const postConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  return axios
    .post(endpoint, postBody, postConfig)
    .then((response) => {
      const { access_token, refresh_token } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
      };
    })
    .catch((err) => {
      if (err.response && err.response.data) {
        console.log(err.response.data);
      } else if (err.request) {
        console.log(err.request);
      } else {
        console.log(err);
      }
    });
};
