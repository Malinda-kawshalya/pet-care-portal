const crypto = require("crypto");
const { z } = require("zod");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { ALL_ROLES, USER_ROLES } = require("../constants/roles");
const {
  comparePassword,
  hashPassword,
  isValidPassword,
} = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");
const { sendPasswordResetEmail } = require("../services/email.service");
const env = require("../config/env");

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  role: z.enum([USER_ROLES.ADOPTER, USER_ROLES.SHOP_OWNER]).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10),
  newPassword: z.string(),
});

const createUserByAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  role: z.enum(ALL_ROLES),
});

function toSafeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { fullName, email, password, phone, role } = parsed.data;

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include at least one number and one special character",
      code: 400,
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
      code: 409,
    });
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    phone,
    role: role || USER_ROLES.ADOPTER,
    lastActiveAt: new Date(),
  });

  const token = signAccessToken(user);

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: toSafeUser(user),
    },
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: 401,
    });
  }

  const isMatch = await comparePassword(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: 401,
    });
  }

  user.lastActiveAt = new Date();
  await user.save();

  const token = signAccessToken(user);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: toSafeUser(user),
    },
  });
}

async function logout(req, res) {
  req.authUser.tokenVersion += 1;
  await req.authUser.save();

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: toSafeUser(req.authUser),
    },
  });
}

async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { email } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = PasswordResetToken.hashRawToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });
    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

    const resetLink = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetLink });
  }

  return res.status(200).json({
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  });
}

async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { token, newPassword } = parsed.data;

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include at least one number and one special character",
      code: 400,
    });
  }

  const tokenHash = PasswordResetToken.hashRawToken(token);

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
      code: 400,
    });
  }

  const user = await User.findById(resetToken.user);

  if (!user || !user.isActive) {
    return res.status(400).json({
      success: false,
      message: "Invalid reset request",
      code: 400,
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  user.lastActiveAt = new Date();
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: resetToken._id } });

  return res.status(200).json({
    success: true,
    message: "Password has been reset successfully",
  });
}

async function createUserByAdmin(req, res) {
  const parsed = createUserByAdminSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { fullName, email, password, phone, role } = parsed.data;

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include at least one number and one special character",
      code: 400,
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
      code: 409,
    });
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    phone,
    role,
    lastActiveAt: new Date(),
  });

  return res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      user: toSafeUser(user),
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  createUserByAdmin,
};
