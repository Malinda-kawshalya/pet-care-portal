import { apiRequest } from "@/lib/api";
import type { ApiResponse } from "@/types/auth";

export type CareGuide = {
  id: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    photos: string[];
    healthStatus?: string;
  };
  adopter: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  content: string;
  sourceType: "system_generated" | "vet_authored";
  author?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  approvalStatus: "pending_approval" | "approved" | "rejected";
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  approvedAt?: string | null;
  vetVerified: boolean;
  verifiedBy?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  verifiedAt?: string | null;
  version: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getCareGuide(petId: string): Promise<ApiResponse<{ guide: CareGuide }>> {
  return apiRequest(`/care-guide/${petId}`, { auth: true });
}

export async function regenerateCareGuide(petId: string): Promise<ApiResponse<{ guide: CareGuide }>> {
  return apiRequest(`/care-guide/${petId}/regenerate`, {
    method: "POST",
    auth: true,
  });
}

export async function submitVetCareGuide(
  petId: string,
  content: string
): Promise<ApiResponse<{ guide: CareGuide }>> {
  return apiRequest(`/care-guide/${petId}/submit`, {
    method: "POST",
    auth: true,
    body: { content },
  });
}

export async function fetchPendingCareGuides(page = 1, limit = 20) {
  return apiRequest<{ guides: CareGuide[]; page: number; totalPages: number; totalCount: number }>(
    `/care-guide/pending?page=${page}&limit=${limit}`,
    { auth: true }
  );
}

export async function approveCareGuide(guideId: string) {
  return apiRequest<{ guide: CareGuide }>(`/care-guide/${guideId}/approve`, {
    method: "POST",
    auth: true,
  });
}

export async function rejectCareGuide(guideId: string) {
  return apiRequest<{ guide: CareGuide }>(`/care-guide/${guideId}/reject`, {
    method: "POST",
    auth: true,
  });
}

export async function verifyCareGuide(petId: string): Promise<ApiResponse<{ guide: CareGuide }>> {
  return apiRequest(`/care-guide/${petId}/verify`, {
    method: "PATCH",
    auth: true,
  });
}

export async function downloadCareGuidePdf(petId: string): Promise<Response> {
  const authState = require("@/lib/auth-storage").getAuthState();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/care-guide/${petId}/export/pdf`, {
    headers: {
      ...(authState?.token
        ? {
            Authorization: `Bearer ${authState.token}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download care guide");
  }

  return response;
}
