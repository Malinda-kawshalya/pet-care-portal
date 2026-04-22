const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/db");
const { seedDevelopmentData } = require("../src/services/seed-dev-data.service");

async function run() {
  const shouldReset = !process.argv.includes("--keep") || process.argv.includes("--reset");

  try {
    await connectDatabase();
    await seedDevelopmentData({ reset: shouldReset });
  } catch (error) {
    console.error("Development seed failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
