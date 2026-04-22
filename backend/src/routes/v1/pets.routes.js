const { Router } = require("express");
const {
	listPets,
	getPetById,
	submitPet,
	listMyPetsWithHealth,
	createProfilePet,
	listPetsByOwner,
} = require("../../controllers/pet.controller");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = Router();

router.get("/", listPets);
router.post("/submissions", requireAuth, submitPet);
router.post("/profile", requireAuth, requireRole(USER_ROLES.ADOPTER), createProfilePet);
router.get("/mine-with-health", requireAuth, listMyPetsWithHealth);
router.get(
	"/owner/:ownerId",
	requireAuth,
	requireRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.VET, USER_ROLES.ADOPTER),
	listPetsByOwner
);
router.get("/:id", getPetById);

module.exports = router;
