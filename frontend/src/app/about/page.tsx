import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-3xl border border-[#dbe4f4] bg-white p-8 shadow-sm sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">About Us</p>
          <h1 className="mt-3 text-4xl font-extrabold text-[#0f172a] sm:text-5xl">PetAI: Safer adoptions, smarter care</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569] sm:text-lg">
            PetAI is built to make adoption easier for pet parents and rescue communities.
            We combine verified listings, guided adoption workflows, and AI-assisted care support
            so families can make confident decisions and pets can find the right forever homes.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-[#dbe4f4] bg-white p-6">
            <h2 className="text-lg font-bold text-[#0f172a]">Our mission</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              Reduce adoption friction while improving long-term pet well-being through clear,
              transparent tools for adopters, shelters, and veterinarians.
            </p>
          </article>

          <article className="rounded-2xl border border-[#dbe4f4] bg-white p-6">
            <h2 className="text-lg font-bold text-[#0f172a]">What we provide</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              Smart pet discovery, medical timeline tracking, QR support for lost-and-found,
              community events, and AI help for routine care questions.
            </p>
          </article>

          <article className="rounded-2xl border border-[#dbe4f4] bg-white p-6">
            <h2 className="text-lg font-bold text-[#0f172a]">Trust and safety</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              We focus on verification, moderation, and practical guidance. PetAI suggestions
              support decision-making but never replace professional veterinary diagnosis.
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-[#dbe4f4] bg-gradient-to-r from-[#eef4ff] via-[#f8fbff] to-[#fff7ed] p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold text-[#0f172a]">Why families choose PetAI</h2>
          <ul className="mt-4 grid gap-3 text-sm text-[#334155] sm:grid-cols-2">
            <li>Verified listings with clear adoption status updates</li>
            <li>Guided forms that reduce incomplete applications</li>
            <li>AI assistant for pet-care questions and platform support</li>
            <li>Simple communication across owners, shelters, and vets</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
