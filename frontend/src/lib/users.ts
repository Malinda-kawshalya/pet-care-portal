import { apiRequest } from "@/lib/api";

export type AdopterUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "user";
};

export type PublicVeterinarian = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "veterinarian";
  profilePhoto?: string;
  clinicName: string;
  address: string;
  city: string;
  zipCode: string;
  rating: number;
  lat: number;
  lng: number;
  openNow: boolean;
  distanceMiles?: number;
};

export async function fetchAdoptersForVet(query: string = ""): Promise<AdopterUser[]> {
  const searchParams = new URLSearchParams();

  if (query.trim()) {
    searchParams.set("q", query.trim());
  }

  searchParams.set("limit", "50");

  const response = await apiRequest<{ users: AdopterUser[] }>(
    `/users/adopters?${searchParams.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );

  return response.data?.users || [];
}

export async function fetchPublicVeterinarians(options?: {
  q?: string;
  limit?: number;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
}): Promise<PublicVeterinarian[]> {
  const searchParams = new URLSearchParams();

  if (options?.q?.trim()) {
    searchParams.set("q", options.q.trim());
  }

  searchParams.set("limit", String(options?.limit || 25));

  if (typeof options?.lat === "number") {
    searchParams.set("lat", String(options.lat));
  }

  if (typeof options?.lng === "number") {
    searchParams.set("lng", String(options.lng));
  }

  if (typeof options?.radiusMiles === "number") {
    searchParams.set("radiusMiles", String(options.radiusMiles));
  }

  const response = await apiRequest<{ veterinarians: PublicVeterinarian[] }>(
    `/users/veterinarians?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  return response.data?.veterinarians || [];
}
