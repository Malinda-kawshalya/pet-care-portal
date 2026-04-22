"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search, Star } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { vetClinics } from "@/data/vet-clinics";
import type { VetClinic } from "@/data/vet-clinics";
import { fetchPublicVeterinarians } from "@/lib/users";

type LocationState = {
  lat: number;
  lng: number;
};

const defaultCenter: LocationState = {
  lat: 47.6062,
  lng: -122.3321,
};

function toMiles(km: number) {
  return km * 0.621371;
}

function haversineDistanceKm(a: LocationState, b: LocationState) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}

function buildMapEmbedUrl(center: LocationState) {
  const latOffset = 0.08;
  const lngOffset = 0.12;
  const left = center.lng - lngOffset;
  const right = center.lng + lngOffset;
  const top = center.lat + latOffset;
  const bottom = center.lat - latOffset;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
}

export default function FindVetPage() {
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [clinics, setClinics] = useState<Array<VetClinic & { distanceMiles: number }>>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [selectedVetId, setSelectedVetId] = useState<string>(vetClinics[0]?.id || "");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  }, []);

  useEffect(() => {
    let active = true;

    const timeout = window.setTimeout(async () => {
      try {
        setLoadingClinics(true);
        setLoadMessage("");

        const veterinarians = await fetchPublicVeterinarians({
          q: query,
          limit: 25,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radiusMiles: 50,
        });

        if (!active) {
          return;
        }

        const fromBackend = veterinarians.map((vet) => {
          const computedMiles =
            typeof vet.distanceMiles === "number"
              ? vet.distanceMiles
              : toMiles(
                  haversineDistanceKm(
                    userLocation || defaultCenter,
                    { lat: vet.lat, lng: vet.lng }
                  )
                );

          return {
            id: vet.id,
            name: vet.clinicName || vet.fullName,
            address: vet.address,
            city: vet.city,
            zipCode: vet.zipCode,
            phone: vet.phone,
            rating: vet.rating,
            lat: vet.lat,
            lng: vet.lng,
            openNow: vet.openNow,
            distanceMiles: computedMiles,
          };
        });

        setClinics(fromBackend);
      } catch {
        if (!active) {
          return;
        }

        const normalized = query.trim().toLowerCase();

        const fallback = vetClinics
          .filter((clinic) => {
            if (!normalized) {
              return true;
            }

            return (
              clinic.name.toLowerCase().includes(normalized) ||
              clinic.city.toLowerCase().includes(normalized) ||
              clinic.zipCode.toLowerCase().includes(normalized) ||
              clinic.address.toLowerCase().includes(normalized)
            );
          })
          .map((clinic) => ({
            ...clinic,
            distanceMiles: toMiles(
              haversineDistanceKm(userLocation || defaultCenter, {
                lat: clinic.lat,
                lng: clinic.lng,
              })
            ),
          }))
          .sort((a, b) => a.distanceMiles - b.distanceMiles);

        setClinics(fallback);
        setLoadMessage("Live vet service is unavailable right now, showing local directory data.");
      } finally {
        if (active) {
          setLoadingClinics(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query, userLocation]);

  const filteredVets = useMemo(() => clinics, [clinics]);

  const selectedVet =
    filteredVets.find((clinic) => clinic.id === selectedVetId) || filteredVets[0] || null;

  const mapCenter = selectedVet
    ? { lat: selectedVet.lat, lng: selectedVet.lng }
    : userLocation || defaultCenter;

  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-2.5 py-1 text-xs font-semibold text-white">
                +
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#0f172a]">
                Find a Vet
              </h1>
              <p className="mt-1 text-sm text-[#64748b]">Locate trusted care near you</p>
            </div>

            <label className="flex items-center overflow-hidden rounded-xl border border-[#d5dde7] bg-white">
              <span className="pl-4 text-[#94a3b8]"><MapPin size={16} /></span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter zip code, city, or clinic name"
                className="w-full px-3 py-3 text-sm outline-none"
              />
              <span className="inline-flex items-center gap-2 bg-[#0f9b8e] px-5 py-3 text-sm font-semibold text-white">
                <Search size={14} /> Search
              </span>
            </label>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.5fr]">
          <div className="space-y-3">
            {loadingClinics ? (
              <div className="rounded-xl border border-[#dbe4ea] bg-white p-5 text-sm text-[#64748b]">
                Loading nearby vets...
              </div>
            ) : filteredVets.length ? (
              filteredVets.map((clinic) => (
                <VetCard
                  key={clinic.id}
                  clinic={clinic}
                  isActive={clinic.id === selectedVet?.id}
                  userLocation={userLocation}
                  onSelect={() => setSelectedVetId(clinic.id)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-5 text-sm text-[#64748b]">
                No clinics match your search. Try a city or zip code.
              </div>
            )}

            {loadMessage ? (
              <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-xs font-semibold text-[#92400e]">
                {loadMessage}
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d8dee8] bg-white p-2 shadow-sm">
            <iframe
              title="Nearby veterinary map"
              src={buildMapEmbedUrl(mapCenter)}
              className="h-[620px] w-full rounded-xl border-0"
              loading="lazy"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function VetCard({
  clinic,
  isActive,
  userLocation,
  onSelect,
}: {
  clinic: VetClinic & { distanceMiles: number };
  isActive: boolean;
  userLocation: LocationState | null;
  onSelect: () => void;
}) {
  const statusText = clinic.openNow ? "Open Now" : "Closed";
  const statusTone = clinic.openNow ? "text-[#16a34a]" : "text-[#dc2626]";
  const directionsHref = userLocation
    ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${clinic.lat},${clinic.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lng}`;

  return (
    <article
      className={`cursor-pointer rounded-xl border bg-white p-4 transition ${
        isActive ? "border-[#0f9b8e] shadow-sm" : "border-[#dbe4ea] hover:border-[#a8bccd]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-[#0f172a]">{clinic.name}</h2>
        <p className="inline-flex items-center gap-1 rounded-full bg-[#fff7e6] px-2 py-0.5 text-xs font-bold text-[#b45309]">
          <Star size={12} fill="currentColor" /> {clinic.rating.toFixed(1)}
        </p>
      </div>

      <p className="mt-1 text-sm text-[#64748b]">
        {clinic.address}, {clinic.city} {clinic.zipCode}
      </p>

      <p className={`mt-2 text-xs font-semibold ${statusTone}`}>
        {statusText} <span className="text-[#94a3b8]">• {clinic.distanceMiles.toFixed(1)} mi away</span>
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`tel:${clinic.phone}`}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dbe4ea] px-3 py-2 text-sm font-semibold text-[#334155]"
          onClick={(event) => event.stopPropagation()}
        >
          <Phone size={14} /> Call
        </a>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#cae9e6] bg-[#ecfdfb] px-3 py-2 text-sm font-semibold text-[#0f766e]"
          onClick={(event) => event.stopPropagation()}
        >
          <MapPin size={14} /> Directions
        </a>
      </div>
    </article>
  );
}
