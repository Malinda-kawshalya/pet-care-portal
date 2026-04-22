const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");
const {
  listProducts,
  listMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../../controllers/shop.controller");

const router = Router();

router.get("/products", listProducts);
router.get(
  "/products/mine",
  requireAuth,
  requireRole(USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
  listMyProducts
);
router.post(
  "/products",
  requireAuth,
  requireRole(USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
  createProduct
);
router.patch(
  "/products/:id",
  requireAuth,
  requireRole(USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
  updateProduct
);
router.delete(
  "/products/:id",
  requireAuth,
  requireRole(USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
  deleteProduct
);

router.get(
  "/products/pending",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  listPendingProducts
);
router.post(
  "/products/:id/approve",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  approveProduct
);
router.post(
  "/products/:id/reject",
  requireAuth,
  requireRole(USER_ROLES.SUPER_ADMIN),
  rejectProduct
);

module.exports = router;
