export type NotificationType =
  | "registration"
  | "password_reset"
  | "application_status"
  | "health_reminder"
  | "qr_scan_event"
  | "community"
  | "chat_assistant"
  | "security"
  | "system"
  | string;

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
  metadata: Record<string, unknown>;
  channels: {
    inApp: boolean;
    email: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type NotificationChannelPreference = {
  inApp: boolean;
  email: boolean;
};

export type NotificationPreferences = {
  channels: NotificationChannelPreference;
  types: {
    registration: NotificationChannelPreference;
    passwordReset: NotificationChannelPreference;
    applicationStatus: NotificationChannelPreference;
    healthReminder: NotificationChannelPreference;
    qrScanEvent: NotificationChannelPreference;
    community: NotificationChannelPreference;
    chatAssistant: NotificationChannelPreference;
    security: NotificationChannelPreference;
    system: NotificationChannelPreference;
  };
};
