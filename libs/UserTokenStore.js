const fs = require("fs/promises");

class UserTokenStore {
  constructor(filePath) {
    this.filePath = filePath || `${__dirname}/../_userTokens.json`;
  }

  setTokens({ accessToken, refreshToken, validUntil }) {
    const tokens = { accessToken, refreshToken, validUntil };

    return fs.writeFile(this.filePath, JSON.stringify(tokens), "utf-8");
  }

  async getTokens() {
    return fs.readFile(this.filePath, { encoding: "utf-8" }).then((data) => {
      if (!data) {
        return {};
      }

      return JSON.parse(data);
    });
  }

  setAccessToken(accessToken) {
    return this.getTokens().then((tokens) => {
      const updatedTokens = { ...tokens, accessToken };

      return this.setTokens(updatedTokens);
    });
  }

  setRefreshToken(refreshToken) {
    return this.getTokens().then((tokens) => {
      const updatedTokens = { ...tokens, refreshToken };

      return this.setTokens(updatedTokens);
    });
  }

  setValidUntil(validUntil) {
    return this.getTokens().then((tokens) => {
      const updatedTokens = { ...tokens, validUntil };

      return this.setTokens(updatedTokens);
    });
  }

  getAccessToken() {
    return this.getTokens().then((tokens) => {
      return tokens.accessToken;
    });
  }

  getRefreshToken() {
    return this.getTokens().then((tokens) => {
      return tokens.refreshToken;
    });
  }

  getValidUntil() {
    return this.getTokens().then((tokens) => {
      return tokens.validUntil;
    });
  }
}

module.exports = UserTokenStore;
