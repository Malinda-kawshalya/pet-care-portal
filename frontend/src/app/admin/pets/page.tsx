"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  createAdminPet,
  deleteAdminPet,
  emptyPetForm,
  fetchAdminPets,
  updateAdminPet,
  type PetFormInput,
} from "@/lib/admin-pets";
import { getAuthState } from "@/lib/auth-storage";
import { uploadFileToCloudinary } from "@/lib/media-upload";
import type { Pet } from "@/types/pets";

export default function AdminPetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PetFormInput>(emptyPetForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAdminPets();
      setPets(data?.pets || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load pets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const authState = getAuthState();
    if (
      !authState?.token ||
      (authState.user.role !== "admin" && authState.user.role !== "super_admin")
    ) {
      router.replace("/login");
      return;
    }

    void loadPets();
  }, [loadPets, router]);

  function updateField<K extends keyof PetFormInput>(field: K, value: PetFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(pet: Pet) {
    setEditingId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: String(pet.age),
      gender: pet.gender,
      weight: pet.weight === null ? "" : String(pet.weight),
      colour: pet.colour,
      description: pet.description,
      photos: pet.photos.join(", "),
      video: pet.video,
      healthStatus: pet.healthStatus,
      isVaccinated: pet.isVaccinated,
      status: pet.status,
      qrCodeUrl: pet.qrCodeUrl,
    });
    setMessage("");
    setError("");
  }

  function clearForm() {
    setEditingId(null);
    setForm(emptyPetForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await updateAdminPet(editingId, form);
        setMessage("Pet updated successfully.");
      } else {
        await createAdminPet(form);
        setMessage("Pet created successfully.");
      }

      clearForm();
      await loadPets();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save pet");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this pet from public listings?")) {
      return;
    }

    try {
      await deleteAdminPet(id);
      await loadPets();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete pet");
    }
  }

  async function handleApprove(id: string) {
    setError("");
    setMessage("");

    try {
      const pet = pets.find((item) => item.id === id);
      if (!pet) {
        return;
      }

      await updateAdminPet(id, {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: String(pet.age),
        gender: pet.gender,
        weight: pet.weight === null ? "" : String(pet.weight),
        colour: pet.colour,
        description: pet.description,
        photos: pet.photos.join(", "),
        video: pet.video,
        healthStatus: pet.healthStatus,
        isVaccinated: pet.isVaccinated,
        status: "available",
        qrCodeUrl: pet.qrCodeUrl,
      });

      setMessage("Pet approved and now visible on public listings.");
      await loadPets();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Unable to approve pet");
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setUploadingPhotos(true);
    setError("");

    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadFileToCloudinary(file, "pets", "image"))
      );
      const existingUrls = form.photos
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      updateField("photos", [...existingUrls, ...uploadedUrls].join(", "));
      setMessage(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload images");
    } finally {
      setUploadingPhotos(false);
      event.target.value = "";
    }
  }

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingVideo(true);
    setError("");

    try {
      const uploadedUrl = await uploadFileToCloudinary(file, "pets", "video");
      updateField("video", uploadedUrl);
      setMessage("Video uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload video");
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">
            Administrator Tools
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Manage Pets</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Create, edit, and soft-delete pet profiles while keeping public listings clean.
          </p>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-[#0f172a]">
              {editingId ? "Edit Pet" : "Create Pet"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(value) => updateField("name", value)} />
              <Select
                label="Species"
                value={form.species}
                onChange={(value) => updateField("species", value as PetFormInput["species"])}
                options={["dog", "cat", "rabbit", "bird", "other"]}
              />
              <Input label="Breed" value={form.breed} onChange={(value) => updateField("breed", value)} />
              <Input label="Age (months)" value={form.age} onChange={(value) => updateField("age", value)} />
              <Select
                label="Gender"
                value={form.gender}
                onChange={(value) => updateField("gender", value as PetFormInput["gender"])}
                options={["male", "female"]}
              />
              <Input label="Weight (kg)" value={form.weight} onChange={(value) => updateField("weight", value)} />
              <Input label="Colour" value={form.colour} onChange={(value) => updateField("colour", value)} />
              <Select
                label="Status"
                value={form.status}
                onChange={(value) => updateField("status", value as PetFormInput["status"])}
                options={["pending_approval", "available", "reserved", "adopted", "removed"]}
              />
              <label className="sm:col-span-2 block text-sm font-semibold text-[#0f172a]">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                />
              </label>
              <label className="sm:col-span-2 block text-sm font-semibold text-[#0f172a]">
                Photos (comma-separated URLs)
                <textarea
                  value={form.photos}
                  onChange={(event) => updateField("photos", event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                />
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-[#d1d9ea] px-4 py-2 text-xs font-semibold text-[#0f172a]">
                    Upload Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos || saving}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-[#64748b]">
                    {uploadingPhotos ? "Uploading images..." : "You can select multiple files"}
                  </span>
                </div>
              </label>
              <div className="sm:col-span-2">
                <Input label="Video URL" value={form.video} onChange={(value) => updateField("video", value)} />
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-[#d1d9ea] px-4 py-2 text-xs font-semibold text-[#0f172a]">
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo || saving}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-[#64748b]">
                    {uploadingVideo ? "Uploading video..." : "Single video file"}
                  </span>
                </div>
              </div>
              <Input
                label="Health Status"
                value={form.healthStatus}
                onChange={(value) => updateField("healthStatus", value)}
              />
              <Input label="QR Code URL" value={form.qrCodeUrl} onChange={(value) => updateField("qrCodeUrl", value)} />
              <label className="sm:col-span-2 flex items-center gap-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={form.isVaccinated}
                  onChange={(event) => updateField("isVaccinated", event.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1]"
                />
                Vaccinated
              </label>
            </div>

            {error ? <p className="mt-4 text-sm text-[#dc2626]">{error}</p> : null}
            {message ? <p className="mt-4 text-sm text-[#16a34a]">{message}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Pet" : "Create Pet"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-full border border-[#d1d9ea] px-5 py-3 text-sm font-bold text-[#0f172a]"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#0f172a]">Existing Pets</h2>
              <button
                type="button"
                onClick={() => void loadPets()}
                className="rounded-full border border-[#d1d9ea] px-4 py-2 text-sm font-semibold text-[#0f172a]"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-[#64748b]">Loading pets...</p>
            ) : (
              <div className="mt-6 space-y-4">
                {pets.map((pet) => (
                  <article
                    key={pet.id}
                    className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a]">{pet.name}</h3>
                        <p className="text-sm text-[#64748b]">
                          {pet.species} • {pet.breed} • {pet.age} months
                        </p>
                        <p className="mt-1 text-xs text-[#94a3b8]">Status: {pet.status}</p>
                      </div>
                      <div className="flex gap-2">
                        {pet.status === "pending_approval" ? (
                          <button
                            type="button"
                            onClick={() => void handleApprove(pet.id)}
                            className="rounded-full bg-[#16a34a] px-3 py-2 text-xs font-bold text-white"
                          >
                            Approve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => startEdit(pet)}
                          className="rounded-full border border-[#d1d9ea] px-3 py-2 text-xs font-bold text-[#0f172a]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(pet.id)}
                          className="rounded-full bg-[#ef4444] px-3 py-2 text-xs font-bold text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {!pets.length ? (
                  <p className="text-sm text-[#64748b]">No pets created yet.</p>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[#0f172a]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm font-semibold text-[#0f172a]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
