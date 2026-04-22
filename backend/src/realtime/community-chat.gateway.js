const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");

function buildCommunityChatGateway(httpServer, env, userLoader) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Missing token"));
      }

      const payload = verifyAccessToken(token);
      const user = await userLoader(payload.sub);

      if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
        return next(new Error("Unauthorized"));
      }

      socket.authUser = user;
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join("community:main");

    socket.on("community:join", () => {
      socket.join("community:main");
    });
  });

  return io;
}

module.exports = { buildCommunityChatGateway };
