export type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat" | "rabbit" | "bird" | "other";
  breed: string;
  age: number;
  gender: "male" | "female";
  weight: number | null;
  colour: string;
  description: string;
  photos: string[];
  video: string;
  healthStatus: string;
  isVaccinated: boolean;
  status: "pending_approval" | "available" | "reserved" | "adopted" | "removed";
  listingType: "adoption" | "profile";
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type PetListResponse = {
  pets: Pet[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export type PetMedicalRecord = {
  id: string;
  eventType: string;
  title: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MyPetWithMedicalRecords = Pet & {
  medicalRecords: PetMedicalRecord[];
};
