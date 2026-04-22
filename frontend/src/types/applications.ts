import type { Pet } from "@/types/pets";
import type { AuthUser } from "@/types/auth";

export type ApplicationStatus =
  | "received"
  | "under_review"
  | "interview_scheduled"
  | "reserved"
  | "adopted"
  | "rejected";

export type Application = {
  id: string;
  pet: Pick<Pet, "id" | "name" | "species" | "breed" | "age" | "photos" | "status"> | null;
  applicant: Pick<AuthUser, "id" | "fullName" | "email" | "role"> | null;
  status: ApplicationStatus;
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
  adminNotes: Array<{ note: string; author: string; date: string }>;
  statusHistory: Array<{ status: ApplicationStatus; changedAt: string; changedBy: string }>;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
