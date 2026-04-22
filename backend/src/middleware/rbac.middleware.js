function requireRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        code: 401,
      });
    }

    if (!normalizedAllowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    return next();
  };
}

module.exports = { requireRole };
