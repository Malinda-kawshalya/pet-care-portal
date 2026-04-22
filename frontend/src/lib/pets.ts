import { apiRequest } from "@/lib/api";
import type { MyPetWithMedicalRecords, Pet, PetListResponse } from "@/types/pets";

export type PetSearchParams = {
  name?: string;
  species?: string;
  breed?: string;
  gender?: string;
  minAge?: string;
  maxAge?: string;
  sortBy?: "createdAt" | "age";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function fetchPets(params: PetSearchParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiRequest<PetListResponse>(`/pets${query ? `?${query}` : ""}`);
}

export async function fetchPetById(id: string) {
  const response = await apiRequest<{ pet: Pet }>(`/pets/${id}`);
  return response.data?.pet ?? null;
}

export async function fetchPetByIdAuthenticated(id: string) {
  const response = await apiRequest<{ pet: Pet }>(`/pets/${id}`, {
    method: "GET",
    auth: true,
  });

  return response.data?.pet ?? null;
}

export async function submitPet(input: {
  name: string;
  species: Pet["species"];
  breed: string;
  age: number;
  gender: Pet["gender"];
  weight?: number | null;
  colour?: string;
  description?: string;
  photos?: string[];
  video?: string;
  healthStatus?: string;
  isVaccinated: boolean;
}) {
  const response = await apiRequest<{ pet: Pet }>("/pets/submissions", {
    method: "POST",
    auth: true,
    body: input,
  });

  return response.data?.pet ?? null;
}

export async function createProfilePet(input: {
  name: string;
  species: Pet["species"];
  breed: string;
  age: number;
  gender: Pet["gender"];
  weight?: number | null;
  colour?: string;
  description?: string;
  photos?: string[];
  video?: string;
  healthStatus?: string;
  isVaccinated: boolean;
}) {
  const response = await apiRequest<{ pet: Pet }>("/pets/profile", {
    method: "POST",
    auth: true,
    body: input,
  });

  return response.data?.pet ?? null;
}

export async function fetchPetsByOwner(ownerId: string): Promise<Pet[]> {
  const response = await apiRequest<{ pets: Pet[] }>(`/pets/owner/${ownerId}`, {
    method: "GET",
    auth: true,
  });

  return response.data?.pets || [];
}

export async function fetchMyPetsWithHealth(): Promise<MyPetWithMedicalRecords[]> {
  const response = await apiRequest<{ pets: MyPetWithMedicalRecords[] }>("/pets/mine-with-health", {
    method: "GET",
    auth: true,
  });

  return response.data?.pets || [];
}
