const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");

const MAX_INACTIVITY_MS = 24 * 60 * 60 * 1000;

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
        code: 401,
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
        code: 401,
      });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session has been invalidated. Please log in again.",
        code: 401,
      });
    }

    if (user.lastActiveAt) {
      const inactiveFor = Date.now() - user.lastActiveAt.getTime();
      if (inactiveFor > MAX_INACTIVITY_MS) {
        return res.status(401).json({
          success: false,
          message: "Session expired due to inactivity",
          code: 401,
        });
      }
    }

    user.lastActiveAt = new Date();
    await user.save();

    req.authUser = user;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      code: 401,
    });
  }
}

module.exports = { requireAuth };
