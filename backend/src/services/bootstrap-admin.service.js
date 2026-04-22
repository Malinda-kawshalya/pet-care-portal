const User = require("../models/User");
const { USER_ROLES } = require("../constants/roles");
const { hashPassword, isValidPassword } = require("../utils/password");
const env = require("../config/env");

async function bootstrapInitialAdmin() {
  if (!env.ADMIN_BOOTSTRAP_EMAIL || !env.ADMIN_BOOTSTRAP_PASSWORD) {
    return;
  }

  if (!isValidPassword(env.ADMIN_BOOTSTRAP_PASSWORD)) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD must be at least 8 chars with one number and one special character"
    );
  }

  const existing = await User.findOne({
    email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase(),
  });

  if (existing) {
    return;
  }

  await User.create({
    fullName: env.ADMIN_BOOTSTRAP_NAME || "Platform Admin",
    email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase(),
    passwordHash: await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD),
    phone: env.ADMIN_BOOTSTRAP_PHONE || "+10000000000",
    role: USER_ROLES.SUPER_ADMIN,
    lastActiveAt: new Date(),
  });

  console.log("Initial super admin user created from bootstrap environment variables");
}

module.exports = {
  bootstrapInitialAdmin,
};
