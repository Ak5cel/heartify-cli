const crypto = require("crypto");
const QueryString = require("qs");
const { base64Encode, sha256 } = require("../utils/encoders");
const config = require("../config");
const { default: axios } = require("axios");

exports.generateSpotifyAuthURL = () => {
  const baseURL = "https://accounts.spotify.com/authorize";

  const codeVerifier = base64Encode(crypto.randomBytes(32));
  process.env.CODE_VERIFIER = codeVerifier;

  const codeChallenge = base64Encode(sha256(codeVerifier));

  const state = crypto.randomBytes(8).toString("hex");
  process.env.SPOTIFY_CLIENT_STATE = state;

  const params = {
    client_id: config.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: config.redirect_uri,
    state: state,
    scope: config.scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  };

  const fullAuthURL = baseURL + "?" + QueryString.stringify(params);
  return fullAuthURL;
};

exports.listenForAuthCode = (app) => {
  return new Promise((resolve, reject) => {
    app.get("/callback", (req, res, next) => {
      const code = req.query.code;
      const state = req.query.state;
      const error = req.query.error;

      resolve({ code, state, error });
      res.status(200).send();
    });
  });
};

exports.exchangeCodeForTokens = (authCode) => {
  const endpoint = "https://accounts.spotify.com/api/token";

  const postData = {
    grant_type: "authorization_code",
    code: authCode,
    client_id: config.SPOTIFY_CLIENT_ID,
    redirect_uri: config.redirect_uri,
    code_verifier: process.env.CODE_VERIFIER,
  };

  const postConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  return axios.post(endpoint, postData, postConfig).then((response) => {
    const { access_token, refresh_token, expires_in } = response.data;

    const validUntil = Date.now() + expires_in * 1000;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      validUntil,
    };
  });
};
