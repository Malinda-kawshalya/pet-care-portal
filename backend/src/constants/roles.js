const USER_ROLES = {
  USER: "user",
  SUPER_ADMIN: "super_admin",
  VETERINARIAN: "veterinarian",
  ADOPTER: "user",
  ADMIN: "super_admin",
  VET: "veterinarian",
  SHOP_OWNER: "veterinarian",
};

const ALL_ROLES = [USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.VETERINARIAN];

module.exports = {
  USER_ROLES,
  ALL_ROLES,
};
