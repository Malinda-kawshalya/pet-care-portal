import Link from "next/link";
import { Search, ClipboardCheck, Heart, Sparkles, Shield, Zap } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PetCard } from "@/components/ui/PetCard";
import { fetchPets } from "@/lib/pets";

export default async function Home() {
  let featuredPets: Array<{ id: string; name: string; breed: string; age: number; species: string; photos: string[] }> = [];

  try {
    const response = await fetchPets({ page: 1, limit: 4, sortBy: "createdAt", sortOrder: "desc" });
    featuredPets = response.data?.pets ?? [];
  } catch {
    featuredPets = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-60 w-60 rounded-full bg-gradient-to-br from-amber-300/15 to-orange-300/15 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
              {/* Left Content */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 mb-6">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">The Future of Pet Adoption</span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                  Find Your New
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Best Friend
                  </span>
                  <span className="block text-slate-900">Powered by AI</span>
                </h1>

                <p className="mt-6 max-w-xl text-lg text-slate-600 leading-relaxed">
                  Our AI-powered platform makes pet adoption seamless and intelligent. Discover your perfect companion, get personalized care guidance, and join a community of pet lovers.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/pets"
                    className="rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/40 hover:shadow-xl hover:shadow-blue-600/50 transition-all hover:scale-105"
                  >
                    Find a Pet
                  </Link>
                  <Link
                    href="/?openChat=1"
                    className="rounded-full border-2 border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-900 hover:border-blue-600 hover:bg-blue-50 transition-all"
                  >
                    Ask Our AI
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-6">
                  <StatItem value="500+" label="Pets Matched" />
                  <StatItem value="100+" label="Vets Verified" />
                  <StatItem value="4.9★" label="Rated by Users" />
                </div>
              </div>

              {/* Right Hero Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 p-8 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop"
                      alt="Golden Retriever"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 rounded-2xl border-2 border-white bg-white p-5 shadow-2xl max-w-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                        <Heart size={24} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Perfect Match Found!</h4>
                      <p className="text-sm text-slate-600 mt-1">Our AI found your ideal companion in seconds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                Why PetAI Works
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600">
                Experience adoption powered by intelligent matching and lifetime support
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Sparkles size={32} />}
                title="AI Matching"
                description="Our intelligent algorithm finds the perfect pet match based on your lifestyle and preferences."
              />
              <FeatureCard
                icon={<Shield size={32} />}
                title="Verified Safety"
                description="All adopters and pets are thoroughly verified to ensure safe, happy adoptions."
              />
              <FeatureCard
                icon={<Zap size={32} />}
                title="Lifetime Support"
                description="Get AI-powered care guides, health reminders, and expert advice whenever you need it."
              />
            </div>
          </div>
        </section>

        {/* Featured Pets */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                Looking for a Home
              </h2>
              <p className="mt-3 text-slate-600">
                Meet these adorable companions waiting for their perfect family.
              </p>
            </div>
            <Link
              href="/pets"
              className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 group"
            >
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPets.map((pet) => (
              <PetCard
                key={pet.id}
                id={pet.id}
                name={pet.name}
                breed={pet.breed}
                age={`${pet.age} months`}
                location={pet.species}
                image={pet.photos[0] || "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop"}
              />
            ))}
          </div>

          {!featuredPets.length ? (
            <p className="mt-6 text-sm text-slate-500">No featured pets are available right now.</p>
          ) : null}

          <div className="mt-12 text-center md:hidden">
            <Link
              href="/pets"
              className="inline-block rounded-full bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700 transition-all"
            >
              View All Pets
            </Link>
          </div>
        </section>

        {/* Add Pet CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 pb-20">
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl border-2 border-[#fed7aa] bg-gradient-to-r from-[#fff7ed] via-[#fffbeb] to-[#eff6ff] p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c2410c]">For Pet Owners</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                Want to list your pet for adoption?
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                Submit your pet details using our guided form. After admin approval, your pet will appear
                publicly in adoption listings.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/add-pet"
                  className="rounded-full bg-[#ea580c] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#ea580c]/30 hover:bg-[#c2410c]"
                >
                  Add Your Pet
                </Link>
              </div>
            </div>

            <div className="relative h-52 overflow-hidden rounded-2xl border border-white/60 shadow-lg sm:h-64">
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop"
                alt="Adoption ready pet"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 md:p-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-lg text-slate-600 max-w-2xl mx-auto mb-16">
              From discovery to lifetime care, we&apos;ve streamlined every step of your journey.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                step="1"
                icon={<Search size={32} />}
                title="Find a Pet"
                description="Browse curated listings with smart AI-powered filters that match your lifestyle."
              />
              <StepCard
                step="2"
                icon={<ClipboardCheck size={32} />}
                title="Quick Application"
                description="Submit a simple, transparent application. We verify and respond within 24 hours."
              />
              <StepCard
                step="3"
                icon={<Heart size={32} />}
                title="Adopt & Support"
                description="Complete your adoption and receive AI care guides, health reminders, and lifetime support."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
                Ready to Find Your Best Friend?
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-8">
                Join thousands of happy pet parents who found their perfect companion through PetAI.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="rounded-full bg-white text-slate-900 px-8 py-4 font-bold hover:bg-blue-50 transition-all"
                >
                  Get Started Today
                </Link>
                <Link
                  href="/pets"
                  className="rounded-full border-2 border-white text-white px-8 py-4 font-bold hover:bg-white/10 transition-all"
                >
                  Browse Pets
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg">
        {step}
      </div>
      <div className="rounded-2xl bg-white p-8 pt-12 border border-blue-200">
        <div className="text-blue-600 mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
}
