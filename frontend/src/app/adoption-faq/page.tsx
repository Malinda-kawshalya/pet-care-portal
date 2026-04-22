"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircleQuestion, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "How does the adoption process work?",
    answer:
      "Browse pets, submit an adoption application, and wait for review. If the match is a fit, the team schedules a meet-and-greet and finalizes the adoption agreement.",
  },
  {
    question: "What fees are involved?",
    answer:
      "Adoption fees help cover vaccinations, microchipping, food, shelter care, and the medical work needed to prepare a pet for a new home.",
  },
  {
    question: "Can I adopt if I live in an apartment?",
    answer:
      "Yes, if the pet’s size, energy level, and care needs fit your home. We recommend checking the pet’s breed, age, and exercise requirements first.",
  },
  {
    question: "Do you offer a trial period?",
    answer:
      "Some placements include a short adjustment period or follow-up support. The exact policy depends on the pet and the shelter or rescue partner.",
  },
  {
    question: "What if the adoption doesn’t work out?",
    answer:
      "Reach out to support as soon as possible. The team will help you review options and make the safest decision for both you and the pet.",
  },
];

export default function AdoptionFaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fafcff_28%,#f6f8ff_100%)] text-[#0f172a]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[2.25rem] border border-[#f1dfbf] bg-white px-6 py-12 shadow-[0_30px_80px_-45px_rgba(251,146,60,0.55)] sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#ffe1ac] bg-[#fff8e8] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#c2410c]">
              <HelpCircle size={14} /> Adoption FAQ
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Got questions? <span className="text-[#f59e0b]">We’ve got answers</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg">
              Find the essentials about adoption, pet care, and what to expect before you bring a new friend home.
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = index === openIndex;

            return (
              <button
                key={item.question}
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className={`w-full rounded-[1.5rem] border p-5 text-left transition-all ${
                  isOpen
                    ? "border-[#f6c85f] bg-white shadow-[0_20px_45px_-30px_rgba(245,158,11,0.55)]"
                    : "border-[#e5e7eb] bg-white hover:border-[#f6c85f]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${isOpen ? "bg-[#fff5d6] text-[#f59e0b]" : "bg-[#f8fafc] text-[#94a3b8]"}`}>
                      <ShieldCheck size={18} />
                    </span>
                    <span className={`text-base font-bold sm:text-lg ${isOpen ? "text-[#f59e0b]" : "text-[#0f172a]"}`}>
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#f59e0b]" : "text-[#94a3b8]"}`} size={20} />
                </div>
                {isOpen ? (
                  <p className="mt-4 max-w-4xl pl-[3.25rem] text-sm leading-7 text-[#475569] sm:text-base">
                    {item.answer}
                  </p>
                ) : null}
              </button>
            );
          })}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#f59e0b] to-[#fb7185] p-8 text-white shadow-[0_25px_60px_-35px_rgba(245,158,11,0.75)]">
            <MessageCircleQuestion size={34} />
            <h2 className="mt-5 text-3xl font-black">Still have questions?</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/85">
              Our adoption team can help with applications, pet compatibility, and the next steps after approval.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/community"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#c2410c]"
              >
                Ask the community
              </Link>
              <Link
                href="/community"
                className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white"
              >
                Contact support
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e5e7eb] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-2xl font-black">Helpful next steps</h2>
                <p className="text-sm text-[#64748b]">Move from questions to action in a few clicks.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/pets"
                className="rounded-[1.25rem] border border-[#e5e7eb] px-5 py-4 text-sm font-bold text-[#0f172a] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
              >
                Browse pets
              </Link>
              <Link
                href="/success-stories"
                className="rounded-[1.25rem] border border-[#e5e7eb] px-5 py-4 text-sm font-bold text-[#0f172a] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
              >
                Read success stories
              </Link>
              <Link
                href="/add-pet"
                className="rounded-[1.25rem] border border-[#e5e7eb] px-5 py-4 text-sm font-bold text-[#0f172a] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
              >
                Add a pet for adoption
              </Link>
              <Link
                href="/community"
                className="rounded-[1.25rem] border border-[#e5e7eb] px-5 py-4 text-sm font-bold text-[#0f172a] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
              >
                Join community chat
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
