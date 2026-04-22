"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, PlusCircle, Stethoscope, PawPrint, ShieldCheck, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { fetchCurrentUser } from "@/lib/auth";
import { createHealthEvent } from "@/lib/health-events";
import { uploadMediaViaBackend } from "@/lib/media-upload";
import { createProfilePet, fetchMyPetsWithHealth, fetchPetsByOwner } from "@/lib/pets";
import type { MyPetWithMedicalRecords } from "@/types/pets";
import type { Pet } from "@/types/pets";

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "user" | "super_admin" | "veterinarian";
};

const roleLabel: Record<UserProfile["role"], string> = {
  user: "Adopter",
  veterinarian: "Vet",
  super_admin: "Super Admin",
};

type AddPetFormState = {
  name: string;
  species: Pet["species"];
  breed: string;
  age: string;
  gender: Pet["gender"];
  weight: string;
  colour: string;
  description: string;
  photos: string;
  healthStatus: string;
  isVaccinated: boolean;
};

type VetMedicalFormState = {
  eventType:
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
  title: string;
  description: string;
  scheduledDate: string;
  clinic: string;
  phone: string;
  notes: string;
  cost: string;
};

const initialAddPetForm: AddPetFormState = {
  name: "",
  species: "dog",
  breed: "",
  age: "",
  gender: "male",
  weight: "",
  colour: "",
  description: "",
  photos: "",
  healthStatus: "",
  isVaccinated: true,
};

const initialVetMedicalForm: VetMedicalFormState = {
  eventType: "checkup",
  title: "",
  description: "",
  scheduledDate: "",
  clinic: "",
  phone: "",
  notes: "",
  cost: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPets, setMyPets] = useState<MyPetWithMedicalRecords[]>([]);
  const [isPetFormOpen, setIsPetFormOpen] = useState(false);
  const [petForm, setPetForm] = useState<AddPetFormState>(initialAddPetForm);
  const [petSaving, setPetSaving] = useState(false);
  const [petUploading, setPetUploading] = useState(false);
  const [petFormError, setPetFormError] = useState<string | null>(null);
  const [petFormSuccess, setPetFormSuccess] = useState<string | null>(null);

  const [ownerLookupId, setOwnerLookupId] = useState("");
  const [ownerPets, setOwnerPets] = useState<Pet[]>([]);
  const [ownerPetsLoading, setOwnerPetsLoading] = useState(false);
  const [selectedOwnerPetId, setSelectedOwnerPetId] = useState("");
  const [vetMedicalForm, setVetMedicalForm] = useState<VetMedicalFormState>(initialVetMedicalForm);
  const [vetSaving, setVetSaving] = useState(false);
  const [vetError, setVetError] = useState<string | null>(null);
  const [vetSuccess, setVetSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const user = await fetchCurrentUser();
        if (!active) {
          return;
        }

        setProfile(user);

        if (user.role === "user") {
          const pets = await fetchMyPetsWithHealth();
          if (!active) {
            return;
          }
          setMyPets(pets);
        }
      } catch (loadError) {
        console.error("Error fetching profile:", loadError);
        setError("Failed to load profile");
        router.push("/login");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [router]);

  const profilePets = useMemo(
    () => myPets.filter((pet) => pet.listingType === "profile"),
    [myPets]
  );

  const totalProfileMedicalRecords = useMemo(
    () => profilePets.reduce((total, pet) => total + (pet.medicalRecords?.length || 0), 0),
    [profilePets]
  );

  const petPhotoCount = useMemo(
    () =>
      petForm.photos
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean).length,
    [petForm.photos]
  );

  function updatePetForm<K extends keyof AddPetFormState>(key: K, value: AddPetFormState[K]) {
    setPetForm((current) => ({ ...current, [key]: value }));
  }

  function updateVetForm<K extends keyof VetMedicalFormState>(key: K, value: VetMedicalFormState[K]) {
    setVetMedicalForm((current) => ({ ...current, [key]: value }));
  }

  function removePetPhoto(urlToRemove: string) {
    const nextPhotos = petForm.photos
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry && entry !== urlToRemove);

    updatePetForm("photos", nextPhotos.join(", "));
  }

  async function handlePetPhotosUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const existing = petForm.photos
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const remainingSlots = Math.max(0, 10 - existing.length);
    if (remainingSlots <= 0) {
      setPetFormError("You can add up to 10 pet photos.");
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    setPetUploading(true);
    setPetFormError(null);
    setPetFormSuccess(null);

    try {
      const uploadedUrls = await Promise.all(
        filesToUpload.map((file) => uploadMediaViaBackend(file, "pets"))
      );

      updatePetForm("photos", [...existing, ...uploadedUrls].join(", "));
      setPetFormSuccess(
        `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded.`
      );
    } catch (uploadError) {
      setPetFormError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload pet images"
      );
    } finally {
      setPetUploading(false);
      event.target.value = "";
    }
  }

  async function handleAddProfilePet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPetSaving(true);
    setPetFormError(null);
    setPetFormSuccess(null);

    try {
      const createdPet = await createProfilePet({
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed,
        age: Number(petForm.age),
        gender: petForm.gender,
        weight: petForm.weight ? Number(petForm.weight) : null,
        colour: petForm.colour,
        description: petForm.description,
        photos: petForm.photos
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        healthStatus: petForm.healthStatus,
        isVaccinated: petForm.isVaccinated,
      });

      if (!createdPet) {
        throw new Error("Unable to save pet");
      }

      setMyPets((prev) => [
        {
          ...createdPet,
          medicalRecords: [],
        },
        ...prev,
      ]);
      setPetForm(initialAddPetForm);
      setIsPetFormOpen(false);
      setPetFormSuccess("Pet added to your profile successfully.");
    } catch (submitError) {
      setPetFormError(submitError instanceof Error ? submitError.message : "Unable to add pet");
    } finally {
      setPetSaving(false);
    }
  }

  async function handleOwnerPetsLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerLookupId.trim()) {
      setVetError("Enter a pet owner id first.");
      return;
    }

    setOwnerPetsLoading(true);
    setVetError(null);
    setVetSuccess(null);

    try {
      const pets = await fetchPetsByOwner(ownerLookupId.trim());
      setOwnerPets(pets);
      setSelectedOwnerPetId(pets[0]?.id || "");
      if (!pets.length) {
        setVetError("No pets found for this owner id.");
      }
    } catch (lookupError) {
      setVetError(lookupError instanceof Error ? lookupError.message : "Unable to fetch owner pets");
    } finally {
      setOwnerPetsLoading(false);
    }
  }

  async function handleVetMedicalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOwnerPetId) {
      setVetError("Select a pet before submitting medical details.");
      return;
    }

    if (!ownerLookupId.trim()) {
      setVetError("Owner id is required to attach records correctly.");
      return;
    }

    if (!profile) {
      return;
    }

    setVetSaving(true);
    setVetError(null);
    setVetSuccess(null);

    try {
      await createHealthEvent(selectedOwnerPetId, {
        eventType: vetMedicalForm.eventType,
        title: vetMedicalForm.title,
        description: vetMedicalForm.description,
        scheduledDate: vetMedicalForm.scheduledDate,
        notes: vetMedicalForm.notes,
        adopterId: ownerLookupId.trim(),
        cost: vetMedicalForm.cost ? Number(vetMedicalForm.cost) : null,
        veterinarian: {
          name: profile.fullName,
          clinic: vetMedicalForm.clinic,
          phone: vetMedicalForm.phone,
        },
      });

      setVetMedicalForm(initialVetMedicalForm);
      setVetSuccess("Medical details added successfully.");
    } catch (submitError) {
      setVetError(submitError instanceof Error ? submitError.message : "Unable to add medical details");
    } finally {
      setVetSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8ff]">
        <SiteHeader />
        <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-16">
          <div className="rounded-2xl border border-[#dbe4f4] bg-white px-8 py-6 text-center text-[#334155] shadow-sm">
            Loading profile...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf2ff_0%,#f8fbff_45%,#fff8ee_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-[#dbe4f4] bg-white shadow-[0_25px_60px_-40px_rgba(30,64,175,0.45)]">
          <div className="grid gap-6 bg-gradient-to-r from-[#eff6ff] via-[#f8fbff] to-[#fff7ed] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8]">My Account</p>
              <h1 className="mt-2 text-3xl font-extrabold text-[#0f172a] sm:text-4xl">Profile Dashboard</h1>
              <p className="mt-2 text-sm text-[#475569]">
                Manage your account, pets, and medical records in one place.
              </p>
            </div>
            <Link
              href={profile?.role === "veterinarian" ? "/vet" : "/dashboard"}
              className="inline-flex items-center justify-center rounded-full bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1d4ed8]/30"
            >
              Back to Dashboard
            </Link>
          </div>

          {profile ? (
            <div className="grid gap-4 border-t border-[#e2e8f0] p-6 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="Full Name" value={profile.fullName} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Phone" value={profile.phone || "Not provided"} />
              <ProfileField label="Role" value={roleLabel[profile.role]} />
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {profile?.role === "user" ? (
          <section className="rounded-3xl border border-[#dbe4f4] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#0f172a]">My Profile Pets</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Only profile pets are shown here. Adoption listings are kept separate.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-[#475569]">
                  {profilePets.length} profile pets | {totalProfileMedicalRecords} records
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPetFormOpen((prev) => !prev);
                    setPetFormError(null);
                    setPetFormSuccess(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#ea580c]/25 hover:bg-[#c2410c]"
                >
                  <PlusCircle size={16} />
                  {isPetFormOpen ? "Close Form" : "Add Pet"}
                </button>
              </div>
            </div>

            {isPetFormOpen ? (
              <form onSubmit={handleAddProfilePet} className="mt-6 grid gap-4 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 sm:grid-cols-2 sm:p-5">
                <label className="text-sm font-semibold text-[#7c2d12]">
                  Pet Name
                  <input
                    value={petForm.name}
                    onChange={(event) => updatePetForm("name", event.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Species
                  <select
                    value={petForm.species}
                    onChange={(event) => updatePetForm("species", event.target.value as Pet["species"])}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Breed
                  <input
                    value={petForm.breed}
                    onChange={(event) => updatePetForm("breed", event.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Age (months)
                  <input
                    type="number"
                    min="0"
                    value={petForm.age}
                    onChange={(event) => updatePetForm("age", event.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Gender
                  <select
                    value={petForm.gender}
                    onChange={(event) => updatePetForm("gender", event.target.value as Pet["gender"])}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Weight (kg)
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={petForm.weight}
                    onChange={(event) => updatePetForm("weight", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Colour
                  <input
                    value={petForm.colour}
                    onChange={(event) => updatePetForm("colour", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="text-sm font-semibold text-[#7c2d12]">
                  Health Status
                  <input
                    value={petForm.healthStatus}
                    onChange={(event) => updatePetForm("healthStatus", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <div className="sm:col-span-2 rounded-xl border border-[#fdba74] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#7c2d12]">Pet Images</p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#ea580c] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                      {petUploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                      {petUploading ? "Uploading..." : "Upload Images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePetPhotosUpload}
                        disabled={petUploading || petSaving || petPhotoCount >= 10}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    value={petForm.photos}
                    onChange={(event) => updatePetForm("photos", event.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                    placeholder="Uploaded image URLs will appear here"
                  />

                  <div className="mt-2 flex items-center justify-between text-xs text-[#9a3412]">
                    <span>{petPhotoCount} photo{petPhotoCount === 1 ? "" : "s"} added</span>
                    <span>{10 - petPhotoCount} slot{10 - petPhotoCount === 1 ? "" : "s"} left</span>
                  </div>

                  {petPhotoCount > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {petForm.photos
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                        .map((photoUrl, index) => (
                          <div key={`${photoUrl}-${index}`} className="overflow-hidden rounded-xl border border-[#fdba74]">
                            <div className="relative aspect-square w-full bg-[#fff7ed]">
                              <img
                                src={photoUrl}
                                alt={`Pet upload ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 p-2">
                              <span className="truncate text-xs text-[#7c2d12]">Photo {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removePetPhoto(photoUrl)}
                                className="inline-flex items-center gap-1 rounded-full border border-[#fdba74] px-2.5 py-1 text-xs font-semibold text-[#b91c1c]"
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>

                <label className="sm:col-span-2 text-sm font-semibold text-[#7c2d12]">
                  Description
                  <textarea
                    value={petForm.description}
                    onChange={(event) => updatePetForm("description", event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-[#fdba74] bg-white px-3 py-2.5 text-[#0f172a]"
                  />
                </label>

                <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-xl border border-[#fdba74] bg-white px-3 py-2 text-sm font-semibold text-[#7c2d12]">
                  <input
                    type="checkbox"
                    checked={petForm.isVaccinated}
                    onChange={(event) => updatePetForm("isVaccinated", event.target.checked)}
                    className="h-4 w-4"
                  />
                  Vaccinated
                </label>

                {petFormError ? <p className="sm:col-span-2 text-sm text-[#dc2626]">{petFormError}</p> : null}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={petSaving || petUploading}
                    className="rounded-full bg-[#ea580c] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#ea580c]/25 disabled:opacity-60"
                  >
                    {petSaving ? "Saving..." : "Save in Profile"}
                  </button>
                </div>
              </form>
            ) : null}

            {petFormSuccess ? (
              <div className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                {petFormSuccess}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              {profilePets.map((pet) => (
                <article key={pet.id} className="rounded-2xl border border-[#dbe4f4] p-4">
                  <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                    {pet.photos?.[0] ? (
                      <img
                        src={pet.photos[0]}
                        alt={`${pet.name} profile photo`}
                        className="h-[130px] w-[130px] rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-[130px] w-[130px] items-center justify-center rounded-xl bg-[#f1f5f9] text-xs font-semibold text-[#64748b]">
                        No image
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-[#0f172a]">{pet.name}</h3>
                      <p className="text-sm text-[#475569]">
                        {pet.species} • {pet.breed} • {pet.status.replace(/_/g, " ")} • profile only
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/health/${pet.id}`}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Open Health Timeline
                        </Link>
                        <Link
                          href={`/qr/${pet.id}`}
                          className="text-sm font-semibold text-indigo-600 hover:underline"
                        >
                          QR Profile
                        </Link>
                        <Link
                          href={`/profile/pets/${pet.id}`}
                          className="text-sm font-semibold text-[#0f766e] hover:underline"
                        >
                          Pet Profile
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {pet.medicalRecords?.length ? (
                      pet.medicalRecords.slice(0, 5).map((record) => (
                        <div key={record.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                          <p className="font-semibold text-gray-900">{record.title}</p>
                          <p className="text-gray-600">
                            {record.eventType.replace(/_/g, " ")} • {new Date(record.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#64748b]">No medical records yet.</p>
                    )}
                  </div>
                </article>
              ))}

              {!profilePets.length ? (
                <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                  You have not added pets yet.
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {profile?.role === "veterinarian" ? (
          <section className="rounded-3xl border border-[#dbe4f4] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#0f172a]">Vet Medical Entry</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Load an owner&apos;s pets and attach medical details directly.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]">
                <Stethoscope size={14} />
                Veterinarian Tools
              </span>
            </div>

            <form onSubmit={handleOwnerPetsLookup} className="mt-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <label className="block text-sm font-semibold text-[#0f172a]">
                Pet Owner ID
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    value={ownerLookupId}
                    onChange={(event) => setOwnerLookupId(event.target.value)}
                    placeholder="Enter owner user id"
                    className="min-w-[250px] flex-1 rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={ownerPetsLoading}
                    className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {ownerPetsLoading ? "Loading..." : "Load Pets"}
                  </button>
                </div>
              </label>
            </form>

            {ownerPets.length ? (
              <div className="mt-4 rounded-2xl border border-[#e2e8f0] bg-white p-4">
                <h3 className="text-sm font-bold text-[#0f172a]">Owner Pets</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ownerPets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedOwnerPetId(pet.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm ${
                        selectedOwnerPetId === pet.id
                          ? "border-[#1d4ed8] bg-[#eff6ff]"
                          : "border-[#e2e8f0] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <p className="font-semibold text-[#0f172a]">{pet.name}</p>
                      <p className="text-xs text-[#64748b]">{pet.species} • {pet.breed}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleVetMedicalSubmit} className="mt-4 grid gap-4 rounded-2xl border border-[#dbe4f4] bg-[#f8fbff] p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#0f172a]">
                Selected Pet
                <select
                  value={selectedOwnerPetId}
                  onChange={(event) => setSelectedOwnerPetId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                >
                  <option value="">Select pet</option>
                  {ownerPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-[#0f172a]">
                Event Type
                <select
                  value={vetMedicalForm.eventType}
                  onChange={(event) => updateVetForm("eventType", event.target.value as VetMedicalFormState["eventType"])}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                >
                  <option value="checkup">Checkup</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="medication">Medication</option>
                  <option value="vaccination_booster">Booster</option>
                  <option value="flea_treatment">Flea Treatment</option>
                  <option value="dental_cleaning">Dental Cleaning</option>
                  <option value="surgery">Surgery</option>
                  <option value="vaccination_rabies">Rabies Vaccination</option>
                  <option value="vaccination_dhpp">DHPP Vaccination</option>
                  <option value="vaccination_other">Other Vaccination</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-[#0f172a] sm:col-span-2">
                Title
                <input
                  value={vetMedicalForm.title}
                  onChange={(event) => updateVetForm("title", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a]">
                Scheduled Date
                <input
                  type="datetime-local"
                  value={vetMedicalForm.scheduledDate}
                  onChange={(event) => updateVetForm("scheduledDate", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a]">
                Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vetMedicalForm.cost}
                  onChange={(event) => updateVetForm("cost", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a]">
                Clinic
                <input
                  value={vetMedicalForm.clinic}
                  onChange={(event) => updateVetForm("clinic", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a]">
                Phone
                <input
                  value={vetMedicalForm.phone}
                  onChange={(event) => updateVetForm("phone", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a] sm:col-span-2">
                Description
                <textarea
                  value={vetMedicalForm.description}
                  onChange={(event) => updateVetForm("description", event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-semibold text-[#0f172a] sm:col-span-2">
                Notes
                <textarea
                  value={vetMedicalForm.notes}
                  onChange={(event) => updateVetForm("notes", event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#dbe4f4] bg-white px-3 py-2.5"
                />
              </label>

              {vetError ? <p className="sm:col-span-2 text-sm text-[#dc2626]">{vetError}</p> : null}
              {vetSuccess ? <p className="sm:col-span-2 text-sm text-[#15803d]">{vetSuccess}</p> : null}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={vetSaving}
                  className="rounded-full bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {vetSaving ? "Saving..." : "Add Medical Details"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#dbe4f4] bg-white p-4 text-sm text-[#334155]">
            <div className="mb-2 inline-flex rounded-xl bg-[#eff6ff] p-2 text-[#1d4ed8]">
              <PawPrint size={16} />
            </div>
            Profile pets stay private and are visible only in your profile area.
          </div>
          <div className="rounded-2xl border border-[#dbe4f4] bg-white p-4 text-sm text-[#334155]">
            <div className="mb-2 inline-flex rounded-xl bg-[#ecfdf3] p-2 text-[#16a34a]">
              <ShieldCheck size={16} />
            </div>
            Health details are tracked per pet for easier follow-up and treatment history.
          </div>
          <div className="rounded-2xl border border-[#dbe4f4] bg-white p-4 text-sm text-[#334155]">
            <div className="mb-2 inline-flex rounded-xl bg-[#fff7ed] p-2 text-[#ea580c]">
              <Stethoscope size={16} />
            </div>
            Vets can load owner pets and add medical details directly from this page.
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
