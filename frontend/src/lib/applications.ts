import { apiRequest } from "@/lib/api";
import type { Application, ApplicationStatus, Notification } from "@/types/applications";

export type ApplicationFormInput = {
  petId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  physicalAddress: string;
  homeType: "apartment" | "house" | "farm" | "other";
  hasOutdoorSpace: boolean;
  timeAtHome: string;
  isFirstTimeOwner: boolean;
  hasOtherPets: boolean;
  otherPets: string;
  workSchedule: string;
  priorExperience: string;
  reasonForAdoption: string;
  additionalNotes: string;
  agreedToTerms: boolean;
};

export async function submitApplication(input: ApplicationFormInput) {
  const response = await apiRequest<{ application: Application }>("/applications", {
    method: "POST",
    auth: true,
    body: input,
  });

  return response.data?.application ?? null;
}

export async function fetchApplications(params: {
  status?: ApplicationStatus | "";
  pet?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  const response = await apiRequest<{ applications: Application[] }>(
    `/applications${query ? `?${query}` : ""}`,
    { auth: true }
  );

  return response.data?.applications ?? [];
}

export async function updateApplicationStatus(
  id: string,
  input: { status: ApplicationStatus; note?: string }
) {
  const response = await apiRequest<{ application: Application }>(`/applications/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return response.data?.application ?? null;
}

export async function fetchNotifications() {
  const response = await apiRequest<{ notifications: Notification[] }>("/notifications", {
    auth: true,
  });

  return response.data?.notifications ?? [];
}
