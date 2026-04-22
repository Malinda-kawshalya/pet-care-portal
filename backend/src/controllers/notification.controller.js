const { z } = require("zod");
const {
  listNotificationsForUser,
  markNotificationAsReadForUser,
  markAllNotificationsAsReadForUser,
  getNotificationPreferencesForUser,
  updateNotificationPreferencesForUser,
  notificationPrefKeys,
} = require("../services/notification.service");

const listSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z.enum(["true", "false"]).optional().default("false"),
});

const markReadSchema = z.object({
  notificationId: z.string().min(1),
});

const preferenceChannelsSchema = z
  .object({
    email: z.boolean().optional(),
  })
  .optional();

const preferenceTypesSchema = z
  .record(
    z.enum(notificationPrefKeys),
    z.object({
      email: z.boolean().optional(),
    })
  )
  .optional();

const updatePreferenceSchema = z.object({
  channels: preferenceChannelsSchema,
  types: preferenceTypesSchema,
});

function mapNotification(notification) {
  return {
    id: notification._id.toString(),
    _id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    readAt: notification.readAt,
    metadata: notification.metadata,
    channels: notification.channels,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

async function listNotifications(req, res) {
  const parsed = listSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const page = parsed.data.page;
  const limit = parsed.data.limit;
  const unreadOnly = parsed.data.unreadOnly === "true";

  const { notifications, unreadCount, totalCount } = await listNotificationsForUser(
    req.authUser._id,
    {
      limit,
      skip: (page - 1) * limit,
      unreadOnly,
    }
  );

  return res.status(200).json({
    success: true,
    data: {
      notifications: notifications.map(mapNotification),
      unreadCount,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function markNotificationRead(req, res) {
  const parsed = markReadSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const notification = await markNotificationAsReadForUser(
    parsed.data.notificationId,
    req.authUser._id
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: {
      notification: mapNotification(notification),
    },
  });
}

async function markAllNotificationsRead(req, res) {
  const updatedCount = await markAllNotificationsAsReadForUser(req.authUser._id);

  return res.status(200).json({
    success: true,
    message: "Notifications marked as read",
    data: {
      updatedCount,
    },
  });
}

async function getNotificationPreferences(req, res) {
  const preferences = await getNotificationPreferencesForUser(req.authUser._id);

  if (!preferences) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      preferences,
    },
  });
}

async function updateNotificationPreferences(req, res) {
  const parsed = updatePreferenceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const hasChannels = Boolean(parsed.data.channels);
  const hasTypes = Boolean(parsed.data.types && Object.keys(parsed.data.types).length > 0);

  if (!hasChannels && !hasTypes) {
    return res.status(400).json({
      success: false,
      message: "At least one preference update is required",
      code: 400,
    });
  }

  const preferences = await updateNotificationPreferencesForUser(
    req.authUser._id,
    parsed.data
  );

  if (!preferences) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification preferences updated",
    data: {
      preferences,
    },
  });
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
};
