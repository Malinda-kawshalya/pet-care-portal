import { apiRequest } from "@/lib/api";
import type { ApiResponse } from "@/types/auth";

export type EventType =
  | "vaccination"
  | "checkup"
  | "medication"
  | "vaccination_booster"
  | "flea_treatment"
  | "dental_cleaning"
  | "surgery"
  | "vaccination_rabies"
  | "vaccination_dhpp"
  | "vaccination_other"
  | "other";

export type ColorCode = "blue" | "green" | "amber" | "red" | "purple";

export type Veterinarian = {
  name?: string;
  clinic?: string;
  phone?: string;
};

export type HealthEvent = {
  id: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    photos: string[];
  };
  adopter: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  eventType: EventType;
  title: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  veterinarian: Veterinarian;
  cost: number | null;
  notes: string;
  isCompleted: boolean;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  colorCode: ColorCode;
  attachments: string[];
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getHealthEventsByPet(
  petId: string,
  includeCompleted: boolean = false
): Promise<ApiResponse<{ events: HealthEvent[] }>> {
  const url = `/health-events/pet/${petId}/events${includeCompleted ? "?includeCompleted=true" : ""}`;
  return apiRequest(url, { auth: true });
}

export async function getHealthEventsByAdopter(
  includeCompleted: boolean = false
): Promise<ApiResponse<{ events: HealthEvent[] }>> {
  const url = `/health-events/adopter/events${includeCompleted ? "?includeCompleted=true" : ""}`;
  return apiRequest(url, { auth: true });
}

export async function getHealthEventDetail(eventId: string): Promise<ApiResponse<{ event: HealthEvent }>> {
  return apiRequest(`/health-events/event/${eventId}`, { auth: true });
}

export async function createHealthEvent(petId: string, data: {
  eventType: EventType;
  title: string;
  description?: string;
  scheduledDate: string;
  veterinarian?: Veterinarian;
  cost?: number | null;
  notes?: string;
  colorCode?: ColorCode;
  adopterId?: string;
}): Promise<ApiResponse<{ event: HealthEvent }>> {
  return apiRequest(`/health-events/pet/${petId}/event`, {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function updateHealthEvent(eventId: string, data: Partial<{
  eventType: EventType;
  title: string;
  description: string;
  scheduledDate: string;
  veterinarian: Veterinarian;
  cost: number | null;
  notes: string;
  colorCode: ColorCode;
  attachments: string[];
}>): Promise<ApiResponse<{ event: HealthEvent }>> {
  return apiRequest(`/health-events/event/${eventId}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function completeHealthEvent(eventId: string): Promise<ApiResponse<{ event: HealthEvent }>> {
  return apiRequest(`/health-events/event/${eventId}/complete`, {
    method: "POST",
    auth: true,
  });
}

export async function deleteHealthEvent(eventId: string): Promise<ApiResponse<{}>> {
  return apiRequest(`/health-events/event/${eventId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function getColorClass(colorCode: ColorCode): string {
  const colors: Record<ColorCode, string> = {
    blue: "bg-blue-100 border-blue-300 text-blue-700",
    green: "bg-green-100 border-green-300 text-green-700",
    amber: "bg-amber-100 border-amber-300 text-amber-700",
    red: "bg-red-100 border-red-300 text-red-700",
    purple: "bg-purple-100 border-purple-300 text-purple-700",
  };
  return colors[colorCode];
}

export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    vaccination: "Vaccination",
    checkup: "Checkup",
    medication: "Medication",
    vaccination_booster: "Vaccination Booster",
    flea_treatment: "Flea Treatment",
    dental_cleaning: "Dental Cleaning",
    surgery: "Surgery",
    vaccination_rabies: "Rabies Vaccination",
    vaccination_dhpp: "DHPP Vaccination",
    vaccination_other: "Other Vaccination",
    other: "Other Event",
  };
  return labels[type];
}

export function getEventTypeEmoji(type: EventType): string {
  const emojis: Record<EventType, string> = {
    vaccination: "💉",
    checkup: "🏥",
    medication: "💊",
    vaccination_booster: "💉",
    flea_treatment: "🦟",
    dental_cleaning: "🦷",
    surgery: "🏨",
    vaccination_rabies: "💉",
    vaccination_dhpp: "💉",
    vaccination_other: "💉",
    other: "📋",
  };
  return emojis[type];
}
