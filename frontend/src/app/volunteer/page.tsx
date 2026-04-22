"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Clock3, NotebookPen } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { apiRequest } from "@/lib/api";

type VolunteerForm = {
  fullName: string;
  email: string;
  areaOfInterest: string;
  availability: string;
  notes: string;
};

const defaultForm: VolunteerForm = {
  fullName: "",
  email: "",
  areaOfInterest: "",
  availability: "",
  notes: "",
};

export default function VolunteerPage() {
  const [form, setForm] = useState<VolunteerForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof VolunteerForm>(key: K, value: VolunteerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccess("");
    setError("");

    try {
      await apiRequest("/volunteer/applications", {
        method: "POST",
        body: form,
      });

      setSuccess("Application received. Our team will contact you within 3-5 business days.");
      setForm(defaultForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit volunteer form");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <SiteHeader />
      <main className="pb-16">
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-xl sm:p-10">
            <Image
              src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=1600&auto=format&fit=crop"
              alt="Happy dog waiting for adoption"
              fill
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 to-[#0f172a]/30" />
            <div className="relative z-10 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#16a34a]/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
                <BadgeCheck size={14} /> Make an impact
              </p>
              <h1 className="mt-5 text-5xl font-extrabold leading-tight">Be Their Hero.</h1>
              <p className="mt-4 text-lg text-[#d1d5db]">
                Join our community of animal lovers and give pets the care, time, and attention they deserve.
              </p>
              <a
                href="#volunteer-form"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-7 py-3 text-sm font-bold text-[#052e16]"
              >
                Apply to Volunteer <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-extrabold text-[#0f172a]">How You Can Help</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#64748b]">
              There are many ways to contribute your time and skills to help pets in our care.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <VolunteerCard
              title="Shelter Care"
              image="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop"
              description="Help with daily feeding, cleaning, enrichment sessions, and socialization."
              bullets={["Must be 18+ years old", "Weekly commitment required", "Love for all animal breeds"]}
            />
            <VolunteerCard
              title="Foster Parent"
              image="https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1200&auto=format&fit=crop"
              description="Provide temporary homes while pets await adoption and adapt to family life."
              bullets={["Mandatory home check", "Patience and empathy", "Basic pet training skills"]}
            />
            <VolunteerCard
              title="Event Support"
              image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
              description="Support adoption events and outreach campaigns in your local community."
              bullets={["Weekend availability", "Strong communication", "Event setup/teardown help"]}
            />
          </div>
        </section>

        <section id="volunteer-form" className="bg-[#d9fbe8] py-14">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="self-center">
              <h2 className="text-5xl font-extrabold leading-tight text-[#0f172a]">Ready to make a difference?</h2>
              <p className="mt-4 text-sm text-[#334155]">
                Fill out the application form to begin your volunteer journey. After review,
                we will contact you with orientation details.
              </p>

              <div className="mt-8 space-y-3">
                <BenefitPill
                  icon={<NotebookPen size={16} />}
                  title="Simple Process"
                  detail="Fast and easy application"
                />
                <BenefitPill
                  icon={<Clock3 size={16} />}
                  title="Full Training"
                  detail="We guide you through everything"
                />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-[#d5f1df] bg-white p-6 shadow-lg"
            >
              <h3 className="text-xl font-extrabold text-[#0f172a]">Application Form</h3>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-[#334155]">
                  Full Name
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                    placeholder="John Doe"
                  />
                </label>

                <label className="block text-xs font-semibold text-[#334155]">
                  Email Address
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                    placeholder="john@example.com"
                  />
                </label>

                <label className="block text-xs font-semibold text-[#334155]">
                  Area of Interest
                  <select
                    required
                    value={form.areaOfInterest}
                    onChange={(event) => updateField("areaOfInterest", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                  >
                    <option value="">Select a role</option>
                    <option value="shelter-care">Shelter Care</option>
                    <option value="foster-parent">Foster Parent</option>
                    <option value="event-support">Event Support</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-[#334155]">
                  Availability
                  <input
                    required
                    value={form.availability}
                    onChange={(event) => updateField("availability", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                    placeholder="Weekends, weekday evenings, etc."
                  />
                </label>

                <label className="block text-xs font-semibold text-[#334155]">
                  Additional Notes
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                    placeholder="Tell us about your previous volunteer experience."
                  />
                </label>
              </div>

              {success ? <p className="mt-3 text-sm font-semibold text-[#15803d]">{success}</p> : null}
              {error ? <p className="mt-3 text-sm font-semibold text-[#b91c1c]">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 w-full rounded-lg bg-[#10b981] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function VolunteerCard({
  title,
  image,
  description,
  bullets,
}: {
  title: string;
  image: string;
  description: string;
  bullets: string[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-sm">
      <Image src={image} alt={title} width={640} height={320} className="h-44 w-full object-cover" />
      <div className="p-5">
        <h3 className="text-xl font-extrabold text-[#0f172a]">{title}</h3>
        <p className="mt-2 text-sm text-[#64748b]">{description}</p>
        <ul className="mt-4 space-y-1 text-xs text-[#334155]">
          {bullets.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <button className="mt-5 w-full rounded-lg border border-[#d8dee8] px-4 py-2 text-sm font-semibold text-[#0f172a]">
          Learn More
        </button>
      </div>
    </article>
  );
}

function BenefitPill({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#caedd6] bg-white px-4 py-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dcfce7] text-[#047857]">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-[#0f172a]">{title}</p>
        <p className="text-xs text-[#64748b]">{detail}</p>
      </div>
    </div>
  );
}
