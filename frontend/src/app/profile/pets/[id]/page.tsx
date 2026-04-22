"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import QRDisplay from "@/components/qr/QRDisplay";
import { getAuthState } from "@/lib/auth-storage";
import { fetchPetByIdAuthenticated } from "@/lib/pets";
import type { Pet } from "@/types/pets";

export default function ProfilePetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = typeof params.id === "string" ? params.id : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/profile/pets/${petId}`)}`);
      return;
    }

    const loadPet = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchPetByIdAuthenticated(petId);
        if (!result) {
          setError("Pet profile not found.");
          return;
        }

        setPet(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load pet profile.");
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      void loadPet();
    }
  }, [petId, router]);

  return (
    <div className="min-h-screen bg-[#f5f8ff]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Link href="/profile" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
            Back to Profile
          </Link>
          {pet ? (
            <Link href={`/qr/${pet.id}`} className="text-sm font-semibold text-[#4338ca] hover:underline">
              Open QR Profile
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#dbe4f4] bg-white p-6 text-sm text-[#475569]">
            Loading pet profile...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && pet ? (
          <section className="rounded-3xl border border-[#dbe4f4] bg-white p-6 shadow-sm">
            <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-[#dbe4f4] bg-[#f8fafc]">
                {pet.photos?.[0] ? (
                  <img src={pet.photos[0]} alt={`${pet.name} photo`} className="h-[220px] w-full object-cover" />
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-sm text-[#64748b]">No image</div>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-[#0f172a]">{pet.name}</h1>
                <p className="mt-2 text-sm text-[#475569]">
                  {pet.species} • {pet.breed} • {pet.gender} • {pet.age} months
                </p>
                <p className="mt-2 text-sm text-[#475569]">{pet.description || "No description provided."}</p>

                <div className="mt-4 grid gap-2 text-sm text-[#334155] sm:grid-cols-2">
                  <p><span className="font-semibold">Status:</span> {pet.status.replace(/_/g, " ")}</p>
                  <p><span className="font-semibold">Listing:</span> {pet.listingType}</p>
                  <p><span className="font-semibold">Weight:</span> {pet.weight ?? "N/A"}</p>
                  <p><span className="font-semibold">Vaccinated:</span> {pet.isVaccinated ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#dbe4f4] bg-[#f8fbff] p-4">
              <QRDisplay petId={pet.id} petName={pet.name} qrCodeUrl={pet.qrCodeUrl || undefined} isDownloadable={true} />
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
