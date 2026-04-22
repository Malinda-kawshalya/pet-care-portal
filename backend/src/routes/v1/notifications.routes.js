const { Router } = require("express");
const {
	listNotifications,
	markNotificationRead,
	markAllNotificationsRead,
	getNotificationPreferences,
	updateNotificationPreferences,
} = require("../../controllers/notification.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:notificationId/read", requireAuth, markNotificationRead);
router.patch("/read-all", requireAuth, markAllNotificationsRead);
router.get("/preferences", requireAuth, getNotificationPreferences);
router.put("/preferences", requireAuth, updateNotificationPreferences);

module.exports = router;
