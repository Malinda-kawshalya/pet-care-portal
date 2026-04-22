import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ApplyButton } from "@/components/pets/ApplyButton";
import { PetDetailHero } from "@/components/pets/PetDetailHero";
import { PetDetailsTab } from "@/components/pets/PetDetailsTab";
import { SimilarPets } from "@/components/pets/SimilarPets";
import QRDisplay from "@/components/qr/QRDisplay";
import { ChatbotWidget } from "@/components/chat/ChatbotWidget";
import type { Pet } from "@/types/pets";
import { Heart, MessageCircle, MapPin } from "lucide-react";

async function getPet(id: string): Promise<Pet | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  const response = await fetch(`${apiBaseUrl}/pets/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: { pet?: Pet } };
  return payload.data?.pet || null;
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pet = await getPet(id);

  if (!pet) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <SiteHeader />
      
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <PetDetailHero pet={pet} />

        {/* Main Content Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column - Details & Tabs */}
          <section className="space-y-8">
            {/* Pet Description Card */}
            <div className="rounded-3xl border border-blue-200 bg-white p-8 shadow-lg">
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">About {pet.name}</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{pet.name} the {pet.breed}</h2>
              </div>
              <p className="mt-4 text-lg text-gray-700 leading-relaxed">{pet.description}</p>
            </div>

            {/* Details Tabs */}
            <div className="rounded-3xl border border-blue-200 bg-white p-8 shadow-lg">
              <PetDetailsTab pet={pet} />
            </div>

            {/* Similar Pets */}
            <SimilarPets currentSpecies={pet.species} currentId={pet.id} />
          </section>

          {/* Right Column - Sidebar */}
          <aside className="space-y-6">
            {/* Adoption Card */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Ready to Adopt?</h3>
              <p className="text-blue-100 mb-6 text-sm">Take the first step in bringing {pet.name} into your loving home.</p>
              <div className="mb-6">
                <ApplyButton petId={pet.id} />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <Heart size={18} className="flex-shrink-0" />
                  <span>Quick and easy adoption process</span>
                </div>
                <div className="flex gap-3">
                  <MessageCircle size={18} className="flex-shrink-0" />
                  <span>24/7 support from our team</span>
                </div>
                <div className="flex gap-3">
                  <MapPin size={18} className="flex-shrink-0" />
                  <span>Local and nationwide adoption</span>
                </div>
              </div>
            </div>

            {/* Quick Facts */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg space-y-4">
              <h4 className="font-bold text-gray-900 text-lg">Quick Facts</h4>
              <QuickFactRow label="Species" value={pet.species} />
              <QuickFactRow label="Breed" value={pet.breed} />
              <QuickFactRow label="Age" value={`${pet.age} months`} />
              <QuickFactRow label="Weight" value={`${pet.weight} kg`} />
              <QuickFactRow label="Gender" value={pet.gender} />
              <QuickFactRow label="Status" value={pet.status} />
            </div>

            {/* QR Code */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg text-center">
              <h4 className="font-bold text-gray-900 mb-4">Share Profile</h4>
              <QRDisplay
                petId={pet.id}
                petName={pet.name}
                qrCodeUrl={pet.qrCodeUrl || undefined}
                isDownloadable={true}
              />
            </div>

            {/* Contact Card */}
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">Questions?</p>
              <p className="text-sm text-green-800">Contact us anytime or use the chat widget to learn more about {pet.name}.</p>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
      <ChatbotWidget />
    </div>
  );
}

function QuickFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
