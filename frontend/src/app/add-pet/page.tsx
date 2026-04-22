"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthState } from "@/lib/auth-storage";
import { uploadMediaViaBackend } from "@/lib/media-upload";
import { createProfilePet, submitPet } from "@/lib/pets";
import type { Pet } from "@/types/pets";

type AddPetForm = {
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

const initialForm: AddPetForm = {
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

export default function AddPetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProfileMode = searchParams.get("mode") === "profile";
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdPet, setCreatedPet] = useState<Pet | null>(null);
  const [form, setForm] = useState<AddPetForm>(initialForm);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      const redirect = isProfileMode ? "%2Fadd-pet%3Fmode%3Dprofile" : "%2Fadd-pet";
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    setReady(true);
  }, [isProfileMode, router]);

  const photoCount = useMemo(() => {
    return form.photos
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean).length;
  }, [form.photos]);

  function updateField<K extends keyof AddPetForm>(key: K, value: AddPetForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function removePhoto(urlToRemove: string) {
    const nextPhotos = form.photos
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry && entry !== urlToRemove);

    updateField("photos", nextPhotos.join(", "));
  }

  async function handlePhotosUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const existing = form.photos
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const remainingSlots = Math.max(0, 10 - existing.length);
    if (remainingSlots <= 0) {
      setError("You can add up to 10 pet photos.");
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const uploadedUrls = await Promise.all(
        filesToUpload.map((file) => uploadMediaViaBackend(file, "pets"))
      );

      updateField("photos", [...existing, ...uploadedUrls].join(", "));
      setSuccess(
        `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded.`
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload images");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    setCreatedPet(null);

    try {
      const payload = {
        name: form.name,
        species: form.species,
        breed: form.breed,
        age: Number(form.age),
        gender: form.gender,
        weight: form.weight ? Number(form.weight) : null,
        colour: form.colour,
        description: form.description,
        photos: form.photos
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        healthStatus: form.healthStatus,
        isVaccinated: form.isVaccinated,
      };

      const savedPet = isProfileMode
        ? await createProfilePet(payload)
        : await submitPet(payload);

      setForm(initialForm);
      setCreatedPet(savedPet);
      setSuccess(
        isProfileMode
          ? "Your profile pet was added successfully with a unique QR profile."
          : "Your pet was submitted. Admin approval is required before it appears in public listings."
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit pet");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Checking account access...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe7cb_0%,#fff4e7_35%,#f5fbff_70%,#eef8ff_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 overflow-hidden rounded-[2rem] border border-[#f1d8ba] bg-white shadow-[0_28px_60px_-30px_rgba(120,74,26,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute right-6 top-6 rounded-full bg-[#fff7ed] px-4 py-1 text-xs font-semibold text-[#9a3412]">
              {isProfileMode ? "Profile Pet" : "Pet Submission"}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#1f2937] sm:text-4xl">
              {isProfileMode ? "Add your personal profile pet" : "Add your pet for adoption"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#475569]">
              {isProfileMode
                ? "Fill in your pet details. This pet stays private in your profile and is not shown in the adoption section."
                : "Fill in the details and submit. The admin team will review your request and approve it before the pet is visible on the public pets page."}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
              <Field label="Pet name">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <Field label="Species">
                <select
                  value={form.species}
                  onChange={(event) => updateField("species", event.target.value as Pet["species"])}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Breed">
                <input
                  value={form.breed}
                  onChange={(event) => updateField("breed", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <Field label="Age (months)">
                <input
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={(event) => updateField("age", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(event) => updateField("gender", event.target.value as Pet["gender"])}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>

              <Field label="Weight (kg)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight}
                  onChange={(event) => updateField("weight", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <Field label="Colour">
                <input
                  value={form.colour}
                  onChange={(event) => updateField("colour", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <Field label="Health status">
                <input
                  value={form.healthStatus}
                  onChange={(event) => updateField("healthStatus", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </Field>

              <label className="sm:col-span-2 block text-sm font-semibold text-[#0f172a]">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-4 py-3"
                />
              </label>

              <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#cfd8ea] bg-[#f8fbff] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Pet images</p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      Upload up to 10 photos. The first photo becomes the main cover image.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#ea580c] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#ea580c]/20 disabled:opacity-60">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {uploading ? "Uploading..." : "Upload Images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosUpload}
                      disabled={uploading || saving || photoCount >= 10}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  value={form.photos}
                  onChange={(event) => updateField("photos", event.target.value)}
                  rows={3}
                  placeholder="Uploaded image URLs will appear here"
                  className="mt-4 w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                />

                <div className="mt-3 flex items-center justify-between text-xs text-[#64748b]">
                  <span>{photoCount} photo{photoCount === 1 ? "" : "s"} added</span>
                  <span>{10 - photoCount} slot{10 - photoCount === 1 ? "" : "s"} left</span>
                </div>

                {photoCount > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {form.photos
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter(Boolean)
                      .map((photoUrl, index) => (
                        <div key={`${photoUrl}-${index}`} className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
                          <div className="relative aspect-square w-full bg-[#f8fafc]">
                            <img
                              src={photoUrl}
                              alt={`Pet upload ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3 p-3">
                            <p className="truncate text-xs text-[#64748b]">Photo {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => removePhoto(photoUrl)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-semibold text-[#dc2626]"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>

              <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={form.isVaccinated}
                  onChange={(event) => updateField("isVaccinated", event.target.checked)}
                  className="h-4 w-4"
                />
                Vaccinated
              </label>

              {error ? <p className="sm:col-span-2 text-sm text-[#dc2626]">{error}</p> : null}
              {success ? <p className="sm:col-span-2 text-sm text-[#15803d]">{success}</p> : null}

              {createdPet && isProfileMode ? (
                <div className="sm:col-span-2 flex flex-wrap gap-3">
                  <Link
                    href={`/profile/pets/${createdPet.id}`}
                    className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#0f766e]"
                  >
                    Open Pet Profile
                  </Link>
                  <Link
                    href={`/qr/${createdPet.id}`}
                    className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#4338ca]"
                  >
                    Open QR Profile
                  </Link>
                </div>
              ) : null}

              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-full bg-[#ea580c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#ea580c]/30 disabled:opacity-60"
                >
                  {saving ? "Submitting..." : isProfileMode ? "Save Profile Pet" : "Submit for Approval"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(isProfileMode ? "/profile" : "/pets")}
                  className="rounded-full border border-[#d1d9ea] px-6 py-3 text-sm font-bold text-[#0f172a]"
                >
                  {isProfileMode ? "Back to Profile" : "Back to Pets"}
                </button>
              </div>
            </form>
          </div>

          <aside className="relative hidden overflow-hidden bg-[#1f2937] lg:block">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/30 to-[#0f172a]/70" />
            <img
              src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1200&auto=format&fit=crop"
              alt="Dog waiting for adoption"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-black/35 p-4 text-white backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/80">Review Process</p>
              <p className="mt-2 text-sm">
                Submissions are reviewed by admins for safety and quality before being listed publicly.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[#0f172a]">
      {label}
      {children}
    </label>
  );
}
