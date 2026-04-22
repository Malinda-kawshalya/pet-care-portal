const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");
const User = require("./models/User");
const { bootstrapInitialAdmin } = require("./services/bootstrap-admin.service");
const { seedDevelopmentData } = require("./services/seed-dev-data.service");
const { startReminderScheduler } = require("./services/health-event.service");
const { buildCommunityChatGateway } = require("./realtime/community-chat.gateway");
const { setSocketServer } = require("./realtime/socket.instance");

async function startServer() {
  try {
    await connectDatabase();
    await bootstrapInitialAdmin();
    if (env.NODE_ENV !== "production") {
      await seedDevelopmentData({ reset: false });
    }

    // Start health event reminder scheduler
    startReminderScheduler();

    const httpServer = http.createServer(app);
    const io = buildCommunityChatGateway(httpServer, env, (id) => User.findById(id));
    setSocketServer(io);

    httpServer.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
