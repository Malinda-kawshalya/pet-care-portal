"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Heart, ImagePlus, Loader2, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { apiClient } from "@/lib/api";
import { getAuthState } from "@/lib/auth-storage";

type StoryPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  images?: string[];
  author: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    role: string;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
};

type StoryFormState = {
  title: string;
  content: string;
  petName: string;
  tags: string;
  imageUrl: string;
};

const initialForm: StoryFormState = {
  title: "",
  content: "",
  petName: "",
  tags: "",
  imageUrl: "",
};

function formatTagList(rawTags: string): string[] {
  return rawTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<StoryFormState>(initialForm);

  useEffect(() => {
    let active = true;

    async function loadStories() {
      try {
        setLoading(true);
        const response = await apiClient.get(
          "/api/v1/community/posts?category=success-stories&sortBy=featured&limit=12"
        );
        if (!active) {
          return;
        }

        setStories(response.data?.data?.posts || []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load success stories");
          setStories([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStories();

    return () => {
      active = false;
    };
  }, []);

  const featuredStory = stories[0] || null;
  const storyCount = useMemo(() => stories.length, [stories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const authState = getAuthState();
    if (!authState?.token) {
      setError("Please log in to submit a success story.");
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and story details are required.");
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post(
        "/api/v1/community/posts",
        {
          title: form.title.trim(),
          content: [
            form.petName.trim() ? `Pet name: ${form.petName.trim()}` : null,
            form.content.trim(),
          ]
            .filter(Boolean)
            .join("\n\n"),
          category: "success-stories",
          tags: formatTagList(form.tags),
          images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        },
        { auth: true }
      );

      setForm(initialForm);
      setMessage("Your story has been submitted. It will appear after admin approval.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit story");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff4ea_0%,#fffaf4_40%,#f4f7ff_100%)] text-[#0f172a]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#f2dfbf] bg-white shadow-[0_30px_80px_-40px_rgba(251,146,60,0.45)]">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd39b] bg-[#fff7eb] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#c2410c]">
                <Sparkles size={14} /> Heartwarming journeys
              </div>
              <div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  <span className="block">Real adoption stories</span>
                  <span className="bg-gradient-to-r from-[#f97316] to-[#f43f5e] bg-clip-text text-transparent">
                    that start with one brave yes
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg">
                  Read the stories families share after finding their new companion, then add your own story
                  so others can see what a successful adoption looks like in real life.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/community?category=success-stories"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#f97316]/25 transition hover:translate-y-[-1px]"
                >
                  Browse all stories <ArrowRight size={16} />
                </Link>
                <Link
                  href="/adoption-faq"
                  className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-6 py-3 text-sm font-bold text-[#0f172a] transition hover:border-[#f97316] hover:text-[#f97316]"
                >
                  Read the FAQ
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InfoPill value={storyCount} label="Published stories" />
                <InfoPill value="Admin" label="Review required" />
                <InfoPill value="100%" label="Community focused" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#f3e5c7] bg-gradient-to-br from-[#fff9f0] to-white p-5 shadow-sm">
              {featuredStory ? (
                <article className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="overflow-hidden rounded-[1.5rem] bg-[#f8fafc]">
                    <img
                      src={featuredStory.images?.[0] || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop"}
                      alt={featuredStory.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-between rounded-[1.5rem] bg-white p-5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#f97316]">
                        <BadgeCheck size={16} /> Featured story
                      </div>
                      <h2 className="mt-3 text-2xl font-black text-[#0f172a]">{featuredStory.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-[#475569] line-clamp-8">
                        {featuredStory.content}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-[#64748b]">
                      <span>{featuredStory.author.fullName}</span>
                      <span>{new Date(featuredStory.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#f3e5c7] bg-white text-sm text-[#64748b]">
                  No success stories have been approved yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-6 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {message}
          </div>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black text-[#0f172a]">More happy tails</h2>
              <p className="mt-2 text-sm text-[#64748b]">
                Every approved story is a reminder that adoption changes two lives at once.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[1.5rem] border border-[#e2e8f0] bg-white p-8 text-sm text-[#64748b]">
                Loading success stories...
              </div>
            ) : stories.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {stories.map((story) => (
                  <article
                    key={story.id}
                    className="rounded-[1.5rem] border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">
                          Success story
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-[#0f172a]">{story.title}</h3>
                      </div>
                      <Heart className="shrink-0 text-[#f43f5e]" size={18} />
                    </div>
                    <p className="mt-4 line-clamp-5 text-sm leading-6 text-[#475569]">{story.content}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#64748b]">
                      <span>{story.author.fullName}</span>
                      <span>•</span>
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#e2e8f0] bg-white p-8 text-sm text-[#64748b]">
                Be the first to share a success story.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[#f3e5c7] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#f97316]">
                  <ImagePlus size={18} />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-[#0f172a]">Share your story</h2>
                  <p className="text-sm text-[#64748b]">
                    Submit a family update and we’ll review it before publishing.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Field label="Story title">
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm outline-none transition focus:border-[#f97316]"
                    placeholder="How Luna found her forever home"
                  />
                </Field>

                <Field label="Pet name">
                  <input
                    value={form.petName}
                    onChange={(event) => setForm((current) => ({ ...current, petName: event.target.value }))}
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm outline-none transition focus:border-[#f97316]"
                    placeholder="Luna"
                  />
                </Field>

                <Field label="Your story">
                  <textarea
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                    rows={7}
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm outline-none transition focus:border-[#f97316]"
                    placeholder="Tell us what changed after adoption, what makes your pet special, and why others should consider adopting."
                  />
                </Field>

                <Field label="Tags">
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm outline-none transition focus:border-[#f97316]"
                    placeholder="adoption, rescue, family"
                  />
                </Field>

                <Field label="Main image URL">
                  <input
                    value={form.imageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm outline-none transition focus:border-[#f97316]"
                    placeholder="https://..."
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#f43f5e] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#f97316]/25 transition hover:translate-y-[-1px] disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  {submitting ? "Submitting..." : "Submit for approval"}
                </button>
                <p className="text-xs leading-5 text-[#64748b]">
                  Your story will be reviewed by the admin team before it appears on the public page.
                </p>
              </form>
            </div>

            <div className="rounded-[2rem] bg-[#1f2340] p-6 text-white shadow-[0_30px_70px_-40px_rgba(31,35,64,0.8)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fda4af]">Need help?</p>
              <h3 className="mt-3 text-2xl font-black">Want to know what makes a great story?</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Focus on the pet’s personality, how the adoption changed your routine, and one concrete moment
                that made you know it was the right match.
              </p>
              <Link
                href="/adoption-faq"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#1f2340]"
              >
                Open adoption FAQ <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[#0f172a]">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function InfoPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[#f3e5c7] bg-white p-4 shadow-sm">
      <p className="text-2xl font-black text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</p>
    </div>
  );
}
