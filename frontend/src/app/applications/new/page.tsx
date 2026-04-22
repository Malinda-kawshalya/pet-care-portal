"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { submitApplication, type ApplicationFormInput } from "@/lib/applications";
import { fetchPetById } from "@/lib/pets";
import { getAuthState } from "@/lib/auth-storage";
import type { Pet } from "@/types/pets";

const defaultForm: ApplicationFormInput = {
  petId: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  physicalAddress: "",
  homeType: "apartment",
  hasOutdoorSpace: false,
  timeAtHome: "",
  isFirstTimeOwner: false,
  hasOtherPets: false,
  otherPets: "",
  workSchedule: "",
  priorExperience: "",
  reasonForAdoption: "",
  additionalNotes: "",
  agreedToTerms: false,
};

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<ApplicationLoadingState />}>
      <NewApplicationContent />
    </Suspense>
  );
}

function ApplicationLoadingState() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
      <p className="text-sm text-[#64748b]">Loading application form...</p>
    </main>
  );
}

function NewApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId") || "";
  const [pet, setPet] = useState<Pet | null>(null);
  const [form, setForm] = useState<ApplicationFormInput>({ ...defaultForm, petId });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const authState = getAuthState();

    if (!authState?.token) {
      router.replace("/login");
      return;
    }

    if (authState.user.role !== "user") {
      router.replace("/dashboard");
      return;
    }

    if (!petId) {
      setError("Missing pet selection.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadPet() {
      try {
        const data = await fetchPetById(petId);
        if (!active) {
          return;
        }

        if (!data) {
          throw new Error("Pet not found");
        }

        setPet(data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load pet");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPet();

    return () => {
      active = false;
    };
  }, [petId, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const application = await submitApplication(form);
      if (!application) {
        throw new Error("Unable to submit application");
      }

      setSuccess("Application submitted successfully. Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof ApplicationFormInput>(field: K, value: ApplicationFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Loading application form...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">Adoption Workflow</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Submit your application</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Fill out the details below to apply for {pet?.name || "this pet"}.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-6 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {success}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm"
        >
          {/* Personal Information Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0f172a]">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                value={form.fullName}
                onChange={(value) => updateField("fullName", value)}
                placeholder="Enter your full name"
              />
              <Field
                label="Email Address"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="you@example.com"
                type="email"
              />
              <Field
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(value) => updateField("phoneNumber", value)}
                placeholder="(123) 456-7890"
              />
              <Field
                label="Physical Address"
                value={form.physicalAddress}
                onChange={(value) => updateField("physicalAddress", value)}
                placeholder="123 Main St, Anytown, USA"
              />
            </div>
          </div>

          {/* Home & Lifestyle Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0f172a]">Home & Lifestyle</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Type of home"
                value={form.homeType}
                onChange={(value) => updateField("homeType", value as ApplicationFormInput["homeType"])}
                options={["apartment", "house", "farm", "other"]}
              />
              <label className="flex items-center gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={form.hasOutdoorSpace}
                  onChange={(event) => updateField("hasOutdoorSpace", event.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1]"
                />
                Do you have a yard?
              </label>
              <label className="sm:col-span-2 block text-sm font-semibold text-[#0f172a]">
                How much time is someone typically at home per day?
                <input
                  value={form.timeAtHome}
                  onChange={(event) => updateField("timeAtHome", event.target.value)}
                  placeholder="e.g., 8+ hours, work from home"
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                />
              </label>
            </div>
          </div>

          {/* Experience with Pets Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0f172a]">Experience with Pets</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="radio"
                  name="firstTimeOwner"
                  checked={form.isFirstTimeOwner}
                  onChange={() => updateField("isFirstTimeOwner", true)}
                  className="h-4 w-4 rounded-full border-[#cbd5e1]"
                />
                Yes, this is my first pet
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="radio"
                  name="firstTimeOwner"
                  checked={!form.isFirstTimeOwner}
                  onChange={() => updateField("isFirstTimeOwner", false)}
                  className="h-4 w-4 rounded-full border-[#cbd5e1]"
                />
                No, I have owned pets before
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="radio"
                  name="otherPets"
                  checked={form.hasOtherPets}
                  onChange={() => updateField("hasOtherPets", true)}
                  className="h-4 w-4 rounded-full border-[#cbd5e1]"
                />
                Yes, I currently have other pets
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <input
                  type="radio"
                  name="otherPets"
                  checked={!form.hasOtherPets}
                  onChange={() => updateField("hasOtherPets", false)}
                  className="h-4 w-4 rounded-full border-[#cbd5e1]"
                />
                No, this will be my first/only pet
              </label>

              <label className="sm:col-span-2 block text-sm font-semibold text-[#0f172a]">
                Please describe your previous pet experience
                <textarea
                  value={form.priorExperience}
                  onChange={(event) => updateField("priorExperience", event.target.value)}
                  placeholder="Describe the types of pets you've owned, breeds, temperaments, etc."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                />
              </label>
            </div>
          </div>

          {/* Reason and Additional Notes Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0f172a]">Reason for Adoption</h2>
            <label className="block text-sm font-semibold text-[#0f172a]">
              Why do you want to adopt this pet?
              <textarea
                value={form.reasonForAdoption}
                onChange={(event) => updateField("reasonForAdoption", event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
              />
            </label>
          </div>

          {/* Additional Notes Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0f172a]">Additional Notes</h2>
            <label className="block text-sm font-semibold text-[#0f172a]">
              Is there anything else you'd like us to know?
              <textarea
                value={form.additionalNotes}
                onChange={(event) => updateField("additionalNotes", event.target.value)}
                placeholder="Tell us about your expectations, why you chose this pet, or any questions you have."
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
              />
            </label>
          </div>

          {/* Terms Agreement */}
          <div className="mb-6">
            <label className="flex items-start gap-3 rounded-xl border border-[#d5dfef] px-4 py-3 text-sm text-[#0f172a]">
              <input
                type="checkbox"
                checked={form.agreedToTerms}
                onChange={(event) => updateField("agreedToTerms", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#cbd5e1]"
              />
              I confirm that all the information provided in this application is accurate and complete to the best of my knowledge.
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <Link
              href={`/pets/${petId}`}
              className="rounded-full border border-[#d1d9ea] px-5 py-3 text-sm font-bold text-[#0f172a]"
            >
              Back to Pet
            </Link>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#0f172a]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
