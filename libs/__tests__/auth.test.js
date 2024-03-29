const { generateSpotifyAuthURL, listenForAuthCode } = require("../auth");
const globals = require("../../config/globals");
const http = require("http");
const { default: axios } = require("axios");

describe("generateSpotifyAuthURL()", () => {
  const old_env = Object.assign({}, process.env);

  afterEach(() => {
    // reset the environment variables after each test
    process.env = old_env;
  });

  test("should set env SPOTIFY_CLIENT_STATE to a new string", () => {
    const oldState = process.env.SPOTIFY_CLIENT_STATE;
    generateSpotifyAuthURL();
    const newState = process.env.SPOTIFY_CLIENT_STATE;

    expect(newState).not.toBe(oldState);
  });
  test("should set env CODE_VERIFIER to a new string", () => {
    const oldCodeVerifier = process.env.CODE_VERIFIER;
    generateSpotifyAuthURL();
    const newCodeVerifier = process.env.CODE_VERIFIER;

    expect(newCodeVerifier).not.toBe(oldCodeVerifier);
  });
  test("should return the full spotify auth url with all required query parameters", () => {
    const url = new URL(generateSpotifyAuthURL());

    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("accounts.spotify.com");
    expect(url.pathname).toBe("/authorize");

    const params = url.searchParams;

    expect(params.get("client_id")).toBe(globals.SPOTIFY_CLIENT_ID);
    expect(params.get("response_type")).toBe("code");
    expect(params.get("redirect_uri")).toBe(globals.redirect_uri);

    expect(params.get("state")).toEqual(expect.any(String));
    expect(params.get("state")).toBeTruthy();
    expect(params.get("state")).toBe(process.env.SPOTIFY_CLIENT_STATE);

    expect(params.get("scope")).toBe(globals.scopes.join(" "));

    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toEqual(expect.any(String));
    expect(params.get("code_challenge")).toBeTruthy();
  });
});

describe("listenForAuthCode()", () => {
  test("should listen for a GET request to the callback and resolve with the code and state when user accepts permissions", async () => {
    const testServer = http.createServer();
    testServer.listen();
    const port = testServer.address().port;

    process.nextTick(() => {
      // simulate a delayed GET request to the callback with auth code and state
      // once the tempServer is up and listening,
      // (delay for the time until user clicks 'Accept')
      const _ = axios.get(`http://localhost:${port}/callback`, {
        params: { state: "testState", code: "testCode" },
      });
    });

    await expect(listenForAuthCode(testServer)).resolves.toEqual({
      state: "testState",
      code: "testCode",
      error: null,
    });

    testServer.close();
  });
  test("should listen for a GET request to the callback and resolve with the state and error when user declines permissions", async () => {
    const testServer = http.createServer();
    testServer.listen();
    const port = testServer.address().port;

    process.nextTick(() => {
      // simulate a delayed GET request to the callback with auth code and error
      // once the tempServer is up and listening,
      // (delay for the time until user clicks 'Cancel')
      const _ = axios.get(`http://localhost:${port}/callback`, {
        params: { state: "testState", error: "testError" },
      });
    });

    await expect(listenForAuthCode(testServer)).resolves.toEqual({
      state: "testState",
      code: null,
      error: "testError",
    });

    testServer.close();
  });
});
