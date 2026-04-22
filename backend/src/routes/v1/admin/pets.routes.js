const { Router } = require("express");
const {
  adminListPets,
  createPet,
  updatePet,
  deletePet,
} = require("../../../controllers/pet.controller");
const { requireAuth } = require("../../../middleware/auth.middleware");
const { requireRole } = require("../../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../../constants/roles");

const router = Router();

router.use(requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN));
router.get("/", adminListPets);
router.post("/", createPet);
router.put("/:id", updatePet);
router.delete("/:id", deletePet);

module.exports = router;
