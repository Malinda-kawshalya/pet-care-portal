"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthState } from "@/lib/auth-storage";
import { approveCareGuide, fetchPendingCareGuides, rejectCareGuide, type CareGuide } from "@/lib/care-guide";

export default function AdminCareGuidesPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  async function loadPending() {
    try {
      setLoading(true);
      const response = await fetchPendingCareGuides(1, 40);
      setGuides(response.data?.guides || []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load pending care guides");
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

  async function handleDecision(guideId: string, decision: "approve" | "reject") {
    try {
      setProcessingId(guideId);
      if (decision === "approve") {
        await approveCareGuide(guideId);
      } else {
        await rejectCareGuide(guideId);
      }
      await loadPending();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to process guide");
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
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Pending Care Guide Approvals</h1>
          <p className="mt-2 text-sm text-[#64748b]">Vet-submitted care guides are published only after approval.</p>
        </section>

        {error ? <p className="mt-4 text-sm text-[#dc2626]">{error}</p> : null}

        <section className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-[#64748b]">Loading pending care guides...</p>
          ) : guides.length ? (
            guides.map((guide) => (
              <article key={guide.id} className="rounded-2xl border border-[#dbe4f4] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">{guide.sourceType.replace(/_/g, " ")}</p>
                <h2 className="mt-1 text-xl font-bold text-[#0f172a]">{guide.pet?.name} - Care Guide v{guide.version}</h2>
                <p className="mt-1 text-xs text-[#64748b]">
                  Submitted by {guide.author?.fullName || "Unknown"} for {guide.adopter?.fullName || "Unknown adopter"}
                </p>
                <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#334155] whitespace-pre-wrap">
                  {guide.content}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={processingId === guide.id}
                    onClick={() => void handleDecision(guide.id, "approve")}
                    className="rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === guide.id}
                    onClick={() => void handleDecision(guide.id, "reject")}
                    className="rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-8 text-sm text-[#64748b]">
              No pending care guides right now.
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
