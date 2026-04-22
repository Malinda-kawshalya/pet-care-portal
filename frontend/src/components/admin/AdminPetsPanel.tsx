"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAdminPet,
  deleteAdminPet,
  emptyPetForm,
  fetchAdminPets,
  updateAdminPet,
  type PetFormInput,
} from "@/lib/admin-pets";
import { uploadFileToCloudinary } from "@/lib/media-upload";
import type { Pet } from "@/types/pets";

export function AdminPetsPanel() {
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
    void loadPets();
  }, [loadPets]);

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
    <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#0f172a]">
          {editingId ? "Edit Pet" : "Create Pet"}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#0f172a]">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            />
          </label>
          <label className="block text-sm font-semibold text-[#0f172a]">
            Species
            <select
              value={form.species}
              onChange={(e) => updateField("species", e.target.value as PetFormInput["species"])}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="bird">Bird</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#0f172a]">
            Breed
            <input
              type="text"
              value={form.breed}
              onChange={(e) => updateField("breed", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            />
          </label>
          <label className="block text-sm font-semibold text-[#0f172a]">
            Age (months)
            <input
              type="number"
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            />
          </label>
          <label className="block text-sm font-semibold text-[#0f172a]">
            Gender
            <select
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value as PetFormInput["gender"])}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#0f172a]">
            Weight (kg)
            <input
              type="number"
              value={form.weight}
              onChange={(e) => updateField("weight", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            />
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

      <div className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
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
          <div className="mt-6 space-y-4 max-h-[600px] overflow-y-auto">
            {pets.map((pet) => (
              <article key={pet.id} className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
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
          </div>
        )}
      </div>
    </section>
  );
}
