const { Router } = require("express");
const { getAdminStats } = require("../../../controllers/admin.controller");
const { requireAuth } = require("../../../middleware/auth.middleware");
const { requireRole } = require("../../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../../constants/roles");

const router = Router();

router.get("/stats", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), getAdminStats);

module.exports = router;
