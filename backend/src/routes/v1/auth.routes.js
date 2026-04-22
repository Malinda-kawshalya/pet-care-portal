const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
} = require("../../controllers/auth.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth requests, please try again later.",
    code: 429,
  },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

module.exports = router;
