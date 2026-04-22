let io = null;

function setSocketServer(server) {
  io = server;
}

function getSocketServer() {
  return io;
}

function emitCommunityChatMessage(message) {
  if (!io) {
    return;
  }

  io.to("community:main").emit("community:new-message", message);
}

module.exports = {
  setSocketServer,
  getSocketServer,
  emitCommunityChatMessage,
};
