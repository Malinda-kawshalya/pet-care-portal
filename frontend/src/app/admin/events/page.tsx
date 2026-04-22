"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthState } from "@/lib/auth-storage";
import { approveEvent, fetchPendingEvents, rejectEvent } from "@/lib/events";
import type { EventItem } from "@/types/events";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  async function loadPending() {
    try {
      setLoading(true);
      const response = await fetchPendingEvents(1, 50);
      setEvents(response.data?.events || []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load pending events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const auth = getAuthState();
    if (!auth?.token || auth.user.role !== "super_admin") {
      window.location.href = "/login";
      return;
    }

    void loadPending();
  }, []);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    try {
      setProcessingId(id);
      if (decision === "approve") {
        await approveEvent(id);
      } else {
        await rejectEvent(id);
      }
      await loadPending();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to process event");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">Admin Moderation</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Pending Event Approvals</h1>
          <p className="mt-2 text-sm text-[#64748b]">Approve or reject events submitted by users and vets.</p>
        </section>

        {error ? <p className="mt-4 text-sm text-[#dc2626]">{error}</p> : null}

        <section className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-[#64748b]">Loading pending events...</p>
          ) : events.length ? (
            events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-[#dbe4f4] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">
                  {event.eventType.replace(/_/g, " ")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#0f172a]">{event.title}</h2>
                <p className="mt-2 text-sm text-[#334155]">{event.description || "No description"}</p>
                <p className="mt-2 text-sm text-[#64748b]">
                  {new Date(event.startsAt).toLocaleString()} {event.location ? `• ${event.location}` : ""}
                </p>
                <p className="mt-1 text-xs text-[#94a3b8]">
                  Submitted by {event.createdBy?.fullName || "Unknown"} ({event.createdBy?.role || "n/a"})
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={processingId === event.id}
                    onClick={() => void handleDecision(event.id, "approve")}
                    className="rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === event.id}
                    onClick={() => void handleDecision(event.id, "reject")}
                    className="rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-8 text-sm text-[#64748b]">
              No pending events right now.
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
