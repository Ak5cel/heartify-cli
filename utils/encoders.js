const crypto = require("crypto");

exports.base64Encode = (str) => {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

exports.sha256 = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest();
};
