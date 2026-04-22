import { apiRequest } from "@/lib/api";
import type { Pet, PetListResponse } from "@/types/pets";

export type PetFormInput = {
  name: string;
  species: Pet["species"];
  breed: string;
  age: string;
  gender: Pet["gender"];
  weight: string;
  colour: string;
  description: string;
  photos: string;
  video: string;
  healthStatus: string;
  isVaccinated: boolean;
  status: Pet["status"];
  qrCodeUrl: string;
};

export const emptyPetForm: PetFormInput = {
  name: "",
  species: "dog",
  breed: "",
  age: "",
  gender: "male",
  weight: "",
  colour: "",
  description: "",
  photos: "",
  video: "",
  healthStatus: "",
  isVaccinated: true,
  status: "available",
  qrCodeUrl: "",
};

function toPayload(form: PetFormInput) {
  return {
    name: form.name,
    species: form.species,
    breed: form.breed,
    age: form.age,
    gender: form.gender,
    weight: form.weight === "" ? null : form.weight,
    colour: form.colour,
    description: form.description,
    photos: form.photos
      ? form.photos
          .split(",")
          .map((photo) => photo.trim())
          .filter(Boolean)
      : [],
    video: form.video,
    healthStatus: form.healthStatus,
    isVaccinated: form.isVaccinated,
    status: form.status,
    qrCodeUrl: form.qrCodeUrl,
  };
}

export async function fetchAdminPets(page = 1) {
  const response = await apiRequest<PetListResponse>(`/admin/pets?page=${page}&limit=12`, {
    auth: true,
  });

  return response.data;
}

export async function createAdminPet(form: PetFormInput) {
  const response = await apiRequest<{ pet: Pet }>("/admin/pets", {
    method: "POST",
    auth: true,
    body: toPayload(form),
  });

  return response.data?.pet;
}

export async function updateAdminPet(id: string, form: PetFormInput) {
  const response = await apiRequest<{ pet: Pet }>(`/admin/pets/${id}`, {
    method: "PUT",
    auth: true,
    body: toPayload(form),
  });

  return response.data?.pet;
}

export async function deleteAdminPet(id: string) {
  await apiRequest<{ pet: Pet }>(`/admin/pets/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
