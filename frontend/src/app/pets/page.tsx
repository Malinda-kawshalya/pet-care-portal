"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthState } from "@/lib/auth-storage";
import { PetCard } from "@/components/ui/PetCard";
import { fetchPets } from "@/lib/pets";
import type { Pet } from "@/types/pets";

type Filters = {
  name: string;
  species: string;
  breed: string;
  gender: string;
  minAge: string;
  maxAge: string;
  sortBy: "createdAt" | "age";
  sortOrder: "asc" | "desc";
};

const defaultFilters: Filters = {
  name: "",
  species: "",
  breed: "",
  gender: "",
  minAge: "",
  maxAge: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop";

export default function PetsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPets() {
      setLoading(true);
      setError("");

      try {
        const response = await fetchPets({
          name: appliedFilters.name,
          species: appliedFilters.species,
          breed: appliedFilters.breed,
          gender: appliedFilters.gender,
          minAge: appliedFilters.minAge,
          maxAge: appliedFilters.maxAge,
          sortBy: appliedFilters.sortBy,
          sortOrder: appliedFilters.sortOrder,
          page,
          limit: 12,
        });

        if (!alive) {
          return;
        }

        const data = response.data;
        if (!data) {
          throw new Error("No pets returned from backend");
        }

        setPets(data.pets);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load pets");
          setPets([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadPets();

    return () => {
      alive = false;
    };
  }, [appliedFilters, page]);

  const visibleCount = useMemo(() => pets.length, [pets]);

  function handleChange(field: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function handleClear() {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  }

  function handleAddPet() {
    const authState = getAuthState();
    if (!authState?.token) {
      router.push("/login?redirect=%2Fadd-pet");
      return;
    }

    router.push("/add-pet");
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0f172a]">
            Find Your New Best Friend
          </h1>
          <button
            type="button"
            onClick={handleAddPet}
            className="rounded-full bg-[#ea580c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#ea580c]/30"
          >
            Add Your Pet
          </button>
        </div>

        <p className="mt-3 text-sm text-[#475569]">
          Want to list a pet for adoption? Use Add Your Pet and submit it for admin approval.
          Once approved, your pet will appear in public listings.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-[#dbe4f4] bg-white p-5 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
              placeholder="Search by pet name"
              value={filters.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
            <select
              className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-[#64748b]"
              value={filters.species}
              onChange={(event) => handleChange("species", event.target.value)}
            >
              <option value="">Species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="bird">Bird</option>
              <option value="other">Other</option>
            </select>
            <input
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
              placeholder="Breed"
              value={filters.breed}
              onChange={(event) => handleChange("breed", event.target.value)}
            />
            <select
              className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-[#64748b]"
              value={filters.gender}
              onChange={(event) => handleChange("gender", event.target.value)}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
              placeholder="Min age (months)"
              value={filters.minAge}
              onChange={(event) => handleChange("minAge", event.target.value)}
            />
            <input
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
              placeholder="Max age (months)"
              value={filters.maxAge}
              onChange={(event) => handleChange("maxAge", event.target.value)}
            />
            <select
              className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-[#64748b]"
              value={filters.sortBy}
              onChange={(event) =>
                handleChange("sortBy", event.target.value as Filters["sortBy"])
              }
            >
              <option value="createdAt">Sort by date added</option>
              <option value="age">Sort by age</option>
            </select>
            <select
              className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-[#64748b]"
              value={filters.sortOrder}
              onChange={(event) =>
                handleChange("sortOrder", event.target.value as Filters["sortOrder"])
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[#64748b]">
              {loading ? "Loading pets..." : `${totalCount} pets found`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-[#d1d9ea] px-4 py-2 text-sm font-semibold text-[#0f172a]"
              >
                Clear All
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#2f66ff] px-5 py-2 text-sm font-semibold text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <p className="mt-6 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              id={pet.id}
              name={pet.name}
              breed={pet.breed}
              age={`${pet.age} months`}
              location={pet.species}
              image={pet.photos[0] || fallbackImage}
            />
          ))}
        </section>

        {!loading && visibleCount === 0 && !error ? (
          <p className="mt-10 text-center text-sm text-[#64748b]">No pets matched your filters.</p>
        ) : null}

        <div className="mt-10 flex items-center justify-center gap-4 text-sm text-[#64748b]">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
            className="rounded-full border border-[#d1d9ea] px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-full border border-[#d1d9ea] px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[#64748b]">
          Need help with your submission? Visit the{" "}
          <Link href="/dashboard" className="font-semibold text-[#2f66ff]">
            dashboard
          </Link>{" "}
          after login.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
