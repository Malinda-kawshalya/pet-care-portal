import { apiRequest } from "@/lib/api";
import type { EventItem, EventListPayload } from "@/types/events";

export type EventInput = {
  title: string;
  description?: string;
  location?: string;
  eventType?: "meetup" | "workshop" | "adoption_drive" | "awareness" | "other";
  startsAt: string;
  endsAt?: string | null;
};

export async function fetchEvents(options?: { page?: number; limit?: number; nowOnly?: boolean }) {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (typeof options?.nowOnly === "boolean") params.set("nowOnly", String(options.nowOnly));

  const query = params.toString();
  return apiRequest<EventListPayload>(`/events${query ? `?${query}` : ""}`);
}

export async function fetchMyEvents() {
  const response = await apiRequest<{ events: EventItem[] }>("/events/mine", { auth: true });
  return response.data?.events || [];
}

export async function createEvent(input: EventInput) {
  return apiRequest<{ event: EventItem }>("/events", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function fetchPendingEvents(page = 1, limit = 20) {
  return apiRequest<EventListPayload>(`/events/pending?page=${page}&limit=${limit}`, {
    auth: true,
  });
}

export async function approveEvent(eventId: string) {
  return apiRequest<{ event: EventItem }>(`/events/${eventId}/approve`, {
    method: "POST",
    auth: true,
  });
}

export async function rejectEvent(eventId: string) {
  return apiRequest<{ event: EventItem }>(`/events/${eventId}/reject`, {
    method: "POST",
    auth: true,
  });
}
