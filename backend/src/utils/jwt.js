const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "24h",
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
