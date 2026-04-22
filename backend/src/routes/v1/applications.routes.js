const { Router } = require("express");
const {
  submitApplication,
  listApplications,
  updateApplicationStatus,
} = require("../../controllers/application.controller");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");

const router = Router();

router.post("/", requireAuth, requireRole(USER_ROLES.ADOPTER), submitApplication);
router.get("/", requireAuth, listApplications);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  updateApplicationStatus
);

module.exports = router;
