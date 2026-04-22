const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendGenericNotificationEmail } = require("./notification-email.service");

const notificationPrefKeys = [
  "registration",
  "passwordReset",
  "applicationStatus",
  "healthReminder",
  "qrScanEvent",
  "community",
  "chatAssistant",
  "security",
  "system",
];

const defaultPreferenceByType = {
  registration: { inApp: true, email: true },
  passwordReset: { inApp: true, email: true },
  applicationStatus: { inApp: true, email: true },
  healthReminder: { inApp: true, email: true },
  qrScanEvent: { inApp: true, email: true },
  community: { inApp: true, email: false },
  chatAssistant: { inApp: true, email: false },
  security: { inApp: true, email: true },
  system: { inApp: true, email: true },
};

const typeToPreferenceKey = {
  registration: "registration",
  password_reset: "passwordReset",
  application_status: "applicationStatus",
  health_reminder: "healthReminder",
  qr_scan_event: "qrScanEvent",
  community: "community",
  chat_assistant: "chatAssistant",
  security: "security",
  system: "system",
};

function getPreferenceKeyFromNotificationType(type) {
  return typeToPreferenceKey[type] || "system";
}

function normalizeNotificationPreferences(rawPreferences = {}) {
  const defaults = {
    channels: {
      inApp: true,
      email: true,
    },
    types: {},
  };

  for (const key of notificationPrefKeys) {
    defaults.types[key] = { ...defaultPreferenceByType[key] };
  }

  const legacyValues = rawPreferences || {};
  const channels = {
    inApp: true,
    email:
      typeof legacyValues?.channels?.email === "boolean"
        ? legacyValues.channels.email
        : true,
  };

  const types = {};

  for (const key of notificationPrefKeys) {
    const legacyBoolean = legacyValues[key];
    const nested = legacyValues?.types?.[key];

    if (typeof legacyBoolean === "boolean") {
      types[key] = {
        inApp: true,
        email: legacyBoolean,
      };
      continue;
    }

    if (nested && typeof nested === "object") {
      types[key] = {
        inApp: true,
        email:
          typeof nested.email === "boolean"
            ? nested.email
            : defaultPreferenceByType[key].email,
      };
      continue;
    }

    types[key] = { ...defaultPreferenceByType[key] };
  }

  return {
    ...defaults,
    channels,
    types,
  };
}

function isChannelEnabled(normalizedPreferences, type, channel) {
  const prefKey = getPreferenceKeyFromNotificationType(type);
  const channelEnabled = Boolean(normalizedPreferences.channels?.[channel]);
  const typeEnabled = Boolean(normalizedPreferences.types?.[prefKey]?.[channel]);

  return channelEnabled && typeEnabled;
}

async function createNotification({ recipient, type, title, message, link = "", metadata = {} }) {
  const recipientUser = await User.findById(recipient).select(
    "fullName email notificationPrefs"
  );
  const normalizedPreferences = normalizeNotificationPreferences(
    recipientUser?.notificationPrefs || {}
  );

  const shouldStoreInApp = isChannelEnabled(normalizedPreferences, type, "inApp");
  const shouldSendEmail = isChannelEnabled(normalizedPreferences, type, "email");

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
    channels: {
      inApp: shouldStoreInApp,
      email: shouldSendEmail,
    },
  });

  if (shouldSendEmail && recipientUser?.email) {
    try {
      await sendGenericNotificationEmail({
        to: recipientUser.email,
        recipientName: recipientUser.fullName,
        title,
        message,
        ctaUrl: link,
      });
      notification.emailSentAt = new Date();
      notification.emailError = "";
      await notification.save();
    } catch (error) {
      notification.emailError = error?.message || "Failed to send email";
      await notification.save();
    }
  }

  return notification;
}

async function listNotificationsForUser(userId, { limit = 20, skip = 0, unreadOnly = false } = {}) {
  const query = {
    recipient: userId,
    "channels.inApp": true,
  };

  if (unreadOnly) {
    query.readAt = null;
  }

  const [notifications, unreadCount, totalCount] = await Promise.all([
    Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit),
    Notification.countDocuments({
      recipient: userId,
      "channels.inApp": true,
      readAt: null,
    }),
    Notification.countDocuments(query),
  ]);

  return { notifications, unreadCount, totalCount };
}

async function markNotificationAsReadForUser(notificationId, userId) {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
      "channels.inApp": true,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
    { new: true }
  );
}

async function markAllNotificationsAsReadForUser(userId) {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      "channels.inApp": true,
      readAt: null,
    },
    {
      $set: {
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount || 0;
}

async function getNotificationPreferencesForUser(userId) {
  const user = await User.findById(userId).select("notificationPrefs");
  if (!user) {
    return null;
  }

  return normalizeNotificationPreferences(user.notificationPrefs || {});
}

async function updateNotificationPreferencesForUser(userId, nextPreferences) {
  const user = await User.findById(userId).select("notificationPrefs");
  if (!user) {
    return null;
  }

  const currentPreferences = normalizeNotificationPreferences(user.notificationPrefs || {});
  const mergedPreferences = {
    channels: {
      ...currentPreferences.channels,
      ...((nextPreferences.channels && {
        email: nextPreferences.channels.email,
      }) || {}),
      inApp: true,
    },
    types: {
      ...currentPreferences.types,
    },
  };

  if (nextPreferences.types) {
    for (const key of Object.keys(nextPreferences.types)) {
      if (!mergedPreferences.types[key]) {
        continue;
      }

      mergedPreferences.types[key] = {
        ...mergedPreferences.types[key],
        ...((nextPreferences.types[key] && {
          email: nextPreferences.types[key].email,
        }) || {}),
        inApp: true,
      };
    }
  }

  user.notificationPrefs = mergedPreferences;
  await user.save();

  return mergedPreferences;
}

module.exports = {
  createNotification,
  listNotificationsForUser,
  markNotificationAsReadForUser,
  markAllNotificationsAsReadForUser,
  getNotificationPreferencesForUser,
  updateNotificationPreferencesForUser,
  normalizeNotificationPreferences,
  getPreferenceKeyFromNotificationType,
  notificationPrefKeys,
};
