"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createEvent, fetchEvents } from "@/lib/events";
import { getAuthState } from "@/lib/auth-storage";
import type { EventItem } from "@/types/events";

const initialForm = {
  title: "",
  description: "",
  location: "",
  eventType: "meetup" as const,
  startsAt: "",
  endsAt: "",
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const authState = getAuthState();
  const canSubmitEvent = Boolean(
    authState?.token &&
      (authState.user.role === "user" ||
        authState.user.role === "veterinarian" ||
        authState.user.role === "super_admin")
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetchEvents({ nowOnly: true, limit: 30 });
        if (!active) return;
        setEvents(response.data?.events || []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load events");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const groupedEvents = useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((acc, event) => {
      const key = new Date(event.startsAt).toLocaleDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  function updateField(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await createEvent({
        title: form.title,
        description: form.description,
        location: form.location,
        eventType: form.eventType,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
      });

      setForm(initialForm);
      setShowForm(false);
      setMessage("Event submitted. It will appear after admin approval.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#dbe4f4] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-[#0f172a]">
                Upcoming <span className="text-[#2563eb]">Events</span>
              </h1>
              <p className="mt-2 text-sm text-[#475569]">
                Join local meetups, workshops, and adoption drives. Users and vets can submit new events for admin approval.
              </p>
            </div>
            {canSubmitEvent ? (
              <button
                type="button"
                onClick={() => setShowForm((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Host an Event
              </button>
            ) : null}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-2xl border border-[#dbe4f4] bg-[#f8fbff] p-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#0f172a] md:col-span-2">
                Event title
                <input
                  required
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                />
              </label>

              <label className="block text-sm font-semibold text-[#0f172a]">
                Event type
                <select
                  value={form.eventType}
                  onChange={(event) => updateField("eventType", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                >
                  <option value="meetup">Meetup</option>
                  <option value="workshop">Workshop</option>
                  <option value="adoption_drive">Adoption Drive</option>
                  <option value="awareness">Awareness</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#0f172a]">
                Location
                <input
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                />
              </label>

              <label className="block text-sm font-semibold text-[#0f172a]">
                Starts at
                <input
                  type="datetime-local"
                  required
                  value={form.startsAt}
                  onChange={(event) => updateField("startsAt", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                />
              </label>

              <label className="block text-sm font-semibold text-[#0f172a]">
                Ends at (optional)
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => updateField("endsAt", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                />
              </label>

              <label className="block text-sm font-semibold text-[#0f172a] md:col-span-2">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3"
                />
              </label>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Event"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-[#d1d9ea] px-5 py-2 text-sm font-semibold text-[#0f172a]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {message ? <p className="mt-4 text-sm text-[#15803d]">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-[#dc2626]">{error}</p> : null}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-[#64748b]">Loading events...</p>
          ) : events.length ? (
            Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
              <div key={dateLabel} className="mb-6 last:mb-0">
                <h2 className="text-lg font-bold text-[#0f172a]">{dateLabel}</h2>
                <div className="mt-3 grid gap-3">
                  {dayEvents.map((event) => (
                    <article key={event.id} className="rounded-2xl border border-[#e2e8f0] bg-[#fafcff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
                        {event.eventType.replace(/_/g, " ")}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[#0f172a]">{event.title}</h3>
                      {event.description ? <p className="mt-2 text-sm text-[#475569]">{event.description}</p> : null}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(event.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dbe4f4] bg-[#f8fbff] p-10 text-center">
              <p className="text-xl font-bold text-[#0f172a]">No upcoming events</p>
              <p className="mt-2 text-sm text-[#64748b]">Check back later or submit your own community event.</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
