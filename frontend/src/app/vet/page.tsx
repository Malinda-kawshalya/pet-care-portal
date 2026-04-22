"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import QRDisplay from "@/components/qr/QRDisplay";
import { getAuthState } from "@/lib/auth-storage";
import { fetchPets, fetchPetsByOwner, type PetSearchParams } from "@/lib/pets";
import { fetchMyShopProducts } from "@/lib/shop";
import {
  createHealthEvent,
  getEventTypeLabel,
  getHealthEventsByPet,
  type EventType,
  type HealthEvent,
} from "@/lib/health-events";
import { fetchAdoptersForVet, type AdopterUser } from "@/lib/users";
import type { Pet } from "@/types/pets";
import type { ShopProduct } from "@/types/shop";

type CareRecordForm = {
  eventType: EventType;
  title: string;
  description: string;
  scheduledDate: string;
};

const initialCareRecordForm: CareRecordForm = {
  eventType: "checkup",
  title: "",
  description: "",
  scheduledDate: "",
};

export default function VetDashboardPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [adopters, setAdopters] = useState<AdopterUser[]>([]);
  const [selectedAdopterId, setSelectedAdopterId] = useState<string>("");
  const [adopterPets, setAdopterPets] = useState<Pet[]>([]);
  const [selectedAdopterPetId, setSelectedAdopterPetId] = useState<string>("");
  const [careRecordForm, setCareRecordForm] = useState<CareRecordForm>(initialCareRecordForm);
  const [careRecordSaving, setCareRecordSaving] = useState(false);
  const [careRecordMessage, setCareRecordMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      router.replace("/login");
      return;
    }

    if (authState.user.role !== "veterinarian" && authState.user.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }

    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const petResponse = await fetchPets({ page: 1, limit: 24 } as PetSearchParams);
        const petList = petResponse.data?.pets ?? [];
        const ownerProducts = await fetchMyShopProducts(true);
        const adopterList = await fetchAdoptersForVet();

        if (!active) {
          return;
        }

        setPets(petList);
        setProducts(ownerProducts);
        setAdopters(adopterList);
        setSelectedAdopterId((current) => current || adopterList[0]?.id || "");
        setSelectedPetId((current) => current || petList[0]?.id || "");
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load vet dashboard");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedAdopterId) {
      setAdopterPets([]);
      setSelectedAdopterPetId("");
      return;
    }

    let active = true;

    async function loadAdopterPets() {
      try {
        const ownerPets = await fetchPetsByOwner(selectedAdopterId);
        if (!active) {
          return;
        }

        setAdopterPets(ownerPets);
        setSelectedAdopterPetId(ownerPets[0]?.id || "");
      } catch {
        if (active) {
          setAdopterPets([]);
          setSelectedAdopterPetId("");
        }
      }
    }

    void loadAdopterPets();

    return () => {
      active = false;
    };
  }, [selectedAdopterId]);

  useEffect(() => {
    if (!selectedPetId) {
      setEvents([]);
      return;
    }

    let active = true;

    async function loadEvents() {
      try {
        const response = await getHealthEventsByPet(selectedPetId, true);
        if (active) {
          setEvents(response.data?.events || []);
        }
      } catch {
        if (active) {
          setEvents([]);
        }
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, [selectedPetId]);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  const selectedAdopterPet = useMemo(
    () => adopterPets.find((pet) => pet.id === selectedAdopterPetId) || null,
    [adopterPets, selectedAdopterPetId]
  );

  const completedEvents = events.filter((event) => event.isCompleted).length;
  const upcomingEvents = events.filter((event) => !event.isCompleted).length;

  async function handleCreateCareRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAdopterId || !selectedAdopterPetId) {
      setCareRecordMessage("Select a user and one of their pets first.");
      return;
    }

    setCareRecordSaving(true);
    setCareRecordMessage("");

    try {
      await createHealthEvent(selectedAdopterPetId, {
        adopterId: selectedAdopterId,
        eventType: careRecordForm.eventType,
        title: careRecordForm.title,
        description: careRecordForm.description,
        scheduledDate: careRecordForm.scheduledDate,
      });

      setCareRecordForm(initialCareRecordForm);
      setCareRecordMessage("Medical record added successfully.");

      if (selectedAdopterPetId === selectedPetId) {
        const response = await getHealthEventsByPet(selectedPetId, true);
        setEvents(response.data?.events || []);
      }
    } catch (createError) {
      setCareRecordMessage(
        createError instanceof Error ? createError.message : "Failed to add medical record"
      );
    } finally {
      setCareRecordSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7fe]">
        <SiteHeader />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <p className="text-sm text-[#64748b]">Loading veterinarian dashboard...</p>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#dbe4f4] bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2f66ff]">Veterinarian Workspace</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Vet Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm text-[#475569]">
            Review pet medical records, manage shop products, and jump directly into the selected pet's
            timeline or QR profile.
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Pets in database" value={String(pets.length)} />
          <MetricCard title="Medical records" value={String(events.length)} />
          <MetricCard title="Upcoming items" value={String(upcomingEvents)} />
          <MetricCard title="My products" value={String(products.length)} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a]">Select a pet</h2>
                  <p className="text-sm text-[#64748b]">Load medical records for treatment review.</p>
                </div>
                <Link href="/pets" className="text-sm font-semibold text-[#2f66ff]">
                  Browse pets
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedPetId === pet.id
                        ? "border-[#2f66ff] bg-[#eff4ff] shadow-sm"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }`}
                  >
                    <p className="font-bold text-[#0f172a]">{pet.name}</p>
                    <p className="text-sm text-[#64748b]">{pet.species} • {pet.breed}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPet ? (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#0f172a]">{selectedPet.name}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {selectedPet.species} • {selectedPet.breed} • {selectedPet.age} months
                  </p>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-[#e2e8f0]">
                    <img
                      src={selectedPet.photos[0] || "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop"}
                      alt={selectedPet.name}
                      className="h-56 w-full object-cover"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/health/${selectedPet.id}`}
                      className="rounded-full bg-[#2f66ff] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open Health Timeline
                    </Link>
                    <Link
                      href={`/qr/${selectedPet.id}`}
                      className="rounded-full border border-[#dbe4f4] px-4 py-2 text-sm font-semibold text-[#0f172a]"
                    >
                      Public QR Profile
                    </Link>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-[#0f172a]">Medical records</h3>
                  <p className="mt-1 text-sm text-[#64748b]">Completed and upcoming events for {selectedPet.name}.</p>

                  <div className="mt-5 space-y-3">
                    {events.length ? (
                      events.map((event) => (
                        <article key={event.id} className="rounded-2xl border border-[#e2e8f0] bg-[#fafcff] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-[#0f172a]">{event.title}</p>
                              <p className="text-sm text-[#64748b]">
                                {event.eventType} • {new Date(event.scheduledDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.isCompleted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {event.isCompleted ? "Completed" : "Pending"}
                            </span>
                          </div>
                          {event.description ? <p className="mt-2 text-sm text-[#475569]">{event.description}</p> : null}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#dbe4f4] p-6 text-sm text-[#64748b]">
                        No health records found for this pet.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#e2e8f0] bg-white p-4">
                    <QRDisplay petId={selectedPet.id} petName={selectedPet.name} qrCodeUrl={selectedPet.qrCodeUrl || undefined} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a]">Add medical record by user</h2>
                  <p className="text-sm text-[#64748b]">Select a user first, then choose one of their pets.</p>
                </div>
              </div>

              <form className="mt-5 space-y-3" onSubmit={handleCreateCareRecord}>
                <select
                  value={selectedAdopterId}
                  onChange={(event) => setSelectedAdopterId(event.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                >
                  <option value="">Select user</option>
                  {adopters.map((adopter) => (
                    <option key={adopter.id} value={adopter.id}>
                      {adopter.fullName} ({adopter.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAdopterPetId}
                  onChange={(event) => setSelectedAdopterPetId(event.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                  disabled={!selectedAdopterId}
                >
                  <option value="">Select pet</option>
                  {adopterPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} - {pet.breed} ({pet.listingType === "profile" ? "profile" : "adoption"})
                    </option>
                  ))}
                </select>

                {selectedAdopterPet ? (
                  <p className="text-xs text-[#64748b]">
                    Selected pet: {selectedAdopterPet.name} ({selectedAdopterPet.species})
                  </p>
                ) : null}

                <select
                  value={careRecordForm.eventType}
                  onChange={(event) =>
                    setCareRecordForm((current) => ({
                      ...current,
                      eventType: event.target.value as EventType,
                    }))
                  }
                  className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                  required
                >
                  {[
                    "vaccination",
                    "checkup",
                    "medication",
                    "vaccination_booster",
                    "flea_treatment",
                    "dental_cleaning",
                    "surgery",
                    "vaccination_rabies",
                    "vaccination_dhpp",
                    "vaccination_other",
                    "other",
                  ].map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {getEventTypeLabel(eventType as EventType)}
                    </option>
                  ))}
                </select>

                <input
                  value={careRecordForm.title}
                  onChange={(event) =>
                    setCareRecordForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                  placeholder="Record title"
                  required
                />

                <input
                  type="datetime-local"
                  value={careRecordForm.scheduledDate}
                  onChange={(event) =>
                    setCareRecordForm((current) => ({
                      ...current,
                      scheduledDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                  required
                />

                <textarea
                  value={careRecordForm.description}
                  onChange={(event) =>
                    setCareRecordForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm"
                  placeholder="Optional notes"
                />

                <button
                  type="submit"
                  disabled={careRecordSaving || !selectedAdopterId || !selectedAdopterPetId}
                  className="w-full rounded-xl bg-[#2f66ff] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {careRecordSaving ? "Saving..." : "Add Medical Record"}
                </button>

                {careRecordMessage ? (
                  <p className="text-xs text-[#1e3a8a]">{careRecordMessage}</p>
                ) : null}
              </form>
            </div>

            <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a]">Shop products</h2>
                  <p className="text-sm text-[#64748b]">Products available in your store.</p>
                </div>
                <Link href="/shop" className="text-sm font-semibold text-[#2f66ff]">
                  Manage shop
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {products.length ? (
                  products.slice(0, 6).map((product) => (
                    <article key={product.id} className="rounded-2xl border border-[#e2e8f0] bg-[#fafcff] p-4">
                      <p className="font-semibold text-[#0f172a]">{product.name}</p>
                      <p className="text-sm text-[#64748b]">${product.price.toFixed(2)} • Stock {product.stock}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#dbe4f4] p-6 text-sm text-[#64748b]">
                    No shop products yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#dbe4f4] bg-gradient-to-br from-[#eff4ff] to-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0f172a]">Quick actions</h2>
              <div className="mt-4 grid gap-3">
                <Link href="/admin/vet-verification" className="rounded-2xl border border-[#dbe4f4] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a]">
                  Verify care guides
                </Link>
                <Link href="/community" className="rounded-2xl border border-[#dbe4f4] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a]">
                  Community moderation
                </Link>
                <Link href="/shop" className="rounded-2xl border border-[#dbe4f4] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a]">
                  Add or edit products
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#dbe4f4] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#2f66ff]">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#0f172a]">{value}</p>
    </div>
  );
}