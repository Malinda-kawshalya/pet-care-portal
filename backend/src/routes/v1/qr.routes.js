const express = require("express");
const {
  getQRProfile,
  logScan,
  downloadQRCode,
  getScanHistory,
  reportLost,
  markFound,
  getNearby,
  regenerateQRCode,
} = require("../../controllers/qr.controller");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");

const router = express.Router();

// Public routes (no auth required)
// GET /api/v1/qr/:petId/public - Get public QR profile (SRS alias)
router.get("/:petId/public", getQRProfile);

// GET /api/v1/qr/:petId - Get public QR profile
router.get("/:petId", getQRProfile);

// POST /api/v1/qr/:petId/scan - Log a QR scan
router.post("/:petId/scan", logScan);

// GET /api/v1/qr/:petId/download - Download QR code as PNG
router.get("/:petId/download", downloadQRCode);

// GET /api/v1/qr/nearby - Get nearby lost/found pets
router.get("/nearby/list", getNearby);

// Protected routes (auth required)
// GET /api/v1/qr/:petId/history - Get scan history (admin/vet only)
router.get("/:petId/history", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), getScanHistory);

// POST /api/v1/qr/:petId/lost - Report pet as lost (admin/adopter only)
router.post("/:petId/lost", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADOPTER), reportLost);

// POST /api/v1/qr/:petId/found - Mark lost pet as found
router.post("/:petId/found", requireAuth, markFound);

// POST /api/v1/qr/:petId/regenerate - Regenerate QR code (admin/vet only)
router.post("/:petId/regenerate", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), regenerateQRCode);

module.exports = router;
