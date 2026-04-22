const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const {
  createUploadSignature,
  uploadMedia,
} = require("../../controllers/media.controller");

const router = Router();

router.post("/signature", requireAuth, createUploadSignature);
router.post("/upload", requireAuth, uploadMedia);

module.exports = router;
