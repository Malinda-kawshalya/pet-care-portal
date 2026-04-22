const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");
const {
  listEvents,
  listMyEvents,
  createEvent,
  listPendingEvents,
  approveEvent,
  rejectEvent,
} = require("../../controllers/event.controller");

const router = Router();

router.get("/", listEvents);
router.get(
  "/mine",
  requireAuth,
  requireRole(USER_ROLES.USER, USER_ROLES.VETERINARIAN, USER_ROLES.SUPER_ADMIN),
  listMyEvents
);
router.post(
  "/",
  requireAuth,
  requireRole(USER_ROLES.USER, USER_ROLES.VETERINARIAN, USER_ROLES.SUPER_ADMIN),
  createEvent
);
router.get(
  "/pending",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  listPendingEvents
);
router.post(
  "/:id/approve",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  approveEvent
);
router.post(
  "/:id/reject",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  rejectEvent
);

module.exports = router;
