const { Router } = require("express");
const {
  submitVolunteerApplication,
  listVolunteerApplications,
  reviewVolunteerApplication,
} = require("../../controllers/volunteer.controller");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");

const router = Router();

router.post("/applications", submitVolunteerApplication);
router.get(
  "/applications",
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  listVolunteerApplications
);
router.patch(
  "/applications/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  reviewVolunteerApplication
);

module.exports = router;
