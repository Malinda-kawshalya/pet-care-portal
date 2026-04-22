const { Router } = require("express");
const { createUserByAdmin } = require("../../controllers/auth.controller");
const { listAdopters, listVeterinarians } = require("../../controllers/users.controller");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");

const router = Router();

router.get("/veterinarians", listVeterinarians);

router.get(
  "/adopters",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.VET),
  listAdopters
);

router.post(
  "/",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  createUserByAdmin
);

module.exports = router;
