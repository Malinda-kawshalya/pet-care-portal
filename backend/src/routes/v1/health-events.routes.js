const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");
const {
  createEvent,
  getEventsByPet,
  getEventsByAdopter,
  getEventDetail,
  updateEvent,
  completeEvent,
  deleteEvent,
  triggerReminders,
} = require("../../controllers/health-event.controller");

const router = Router();

// Public/adopter routes
router.get("/adopter/events", requireAuth, getEventsByAdopter);

// Pet-specific routes
router.post("/pet/:petId/event", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), createEvent);
router.get("/pet/:petId/events", requireAuth, getEventsByPet);

// Event-specific routes
router.get("/event/:eventId", requireAuth, getEventDetail);
router.patch("/event/:eventId", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), updateEvent);
router.post("/event/:eventId/complete", requireAuth, completeEvent);
router.delete("/event/:eventId", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), deleteEvent);

// Admin reminder trigger
router.post("/reminders/trigger", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), triggerReminders);

module.exports = router;
