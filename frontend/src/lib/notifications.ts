import { apiRequest } from "@/lib/api";
import type { AppNotification, NotificationPreferences } from "@/types/notifications";

type ListNotificationsResult = {
  notifications: AppNotification[];
  unreadCount: number;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export async function fetchNotifications(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.page) {
    params.set("page", String(options.page));
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  if (typeof options?.unreadOnly === "boolean") {
    params.set("unreadOnly", String(options.unreadOnly));
  }

  const query = params.toString();
  const response = await apiRequest<ListNotificationsResult>(
    `/notifications${query ? `?${query}` : ""}`,
    { auth: true }
  );

  return (
    response.data || {
      notifications: [],
      unreadCount: 0,
      page: 1,
      limit: 20,
      totalCount: 0,
      totalPages: 1,
    }
  );
}

export async function markNotificationRead(notificationId: string) {
  const response = await apiRequest<{ notification: AppNotification }>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      auth: true,
    }
  );

  return response.data?.notification || null;
}

export async function markAllNotificationsRead() {
  const response = await apiRequest<{ updatedCount: number }>("/notifications/read-all", {
    method: "PATCH",
    auth: true,
  });

  return response.data?.updatedCount || 0;
}

export async function fetchNotificationPreferences() {
  const response = await apiRequest<{ preferences: NotificationPreferences }>(
    "/notifications/preferences",
    {
      auth: true,
    }
  );

  if (!response.data?.preferences) {
    throw new Error("Unable to load notification preferences");
  }

  return response.data.preferences;
}

export async function updateNotificationPreferences(update: {
  channels?: Partial<NotificationPreferences["channels"]>;
  types?: Partial<NotificationPreferences["types"]>;
}) {
  const response = await apiRequest<{ preferences: NotificationPreferences }>(
    "/notifications/preferences",
    {
      method: "PUT",
      auth: true,
      body: update,
    }
  );

  if (!response.data?.preferences) {
    throw new Error("Unable to update notification preferences");
  }

  return response.data.preferences;
}
