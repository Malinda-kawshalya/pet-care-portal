const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");
const {
	listGuides,
	getGuide,
	regenerateGuide,
	verifyGuide,
	exportPdf,
	submitVetGuide,
	listPendingGuidesHandler,
	approveGuideHandler,
	rejectGuideHandler,
} = require("../../controllers/care-guide.controller");

const router = Router();

router.get("/", requireAuth, requireRole(USER_ROLES.VET, USER_ROLES.SUPER_ADMIN), listGuides);
router.get("/pending", requireAuth, requireRole(USER_ROLES.SUPER_ADMIN), listPendingGuidesHandler);
router.get("/:petId", requireAuth, getGuide);
router.get("/:petId/export/pdf", requireAuth, exportPdf);
router.post("/:petId/regenerate", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.VET), regenerateGuide);
router.post("/:petId/submit", requireAuth, requireRole(USER_ROLES.VET), submitVetGuide);
router.patch(
  "/:petId/verify",
  requireAuth,
  requireRole(USER_ROLES.VET, USER_ROLES.SUPER_ADMIN),
  verifyGuide
);
router.post(
	"/:guideId/approve",
	requireAuth,
	requireRole(USER_ROLES.SUPER_ADMIN),
	approveGuideHandler
);
router.post(
	"/:guideId/reject",
	requireAuth,
	requireRole(USER_ROLES.SUPER_ADMIN),
	rejectGuideHandler
);

module.exports = router;
