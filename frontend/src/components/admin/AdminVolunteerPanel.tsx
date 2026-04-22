"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type VolunteerApplication = {
  _id: string;
  fullName: string;
  email: string;
  areaOfInterest: string;
  availability: string;
  notes?: string;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
};

type VolunteerApplicationResult = {
  applications?: VolunteerApplication[];
};

const interestLabels: Record<string, string> = {
  "shelter-care": "Shelter Care",
  "foster-parent": "Foster Parent",
  "event-support": "Event Support",
};

export function AdminVolunteerPanel() {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<VolunteerApplicationResult>(
        "/volunteer/applications?status=pending_review&limit=40",
        { auth: true }
      );
      setApplications(response.data?.applications ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load volunteer applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setActingId(id);
    setError("");

    try {
      await apiRequest(`/volunteer/applications/${id}`, {
        method: "PATCH",
        auth: true,
        body: { status },
      });
      await loadApplications();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update volunteer application");
    } finally {
      setActingId("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Volunteer Review</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">Pending Volunteer Applications</h2>
        <p className="mt-2 text-sm text-[#64748b]">Review applicants and approve or reject from this queue.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      <article className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#0f172a]">Queue ({applications.length})</h3>
          <button
            type="button"
            onClick={() => void loadApplications()}
            className="rounded-full border border-[#d5dfef] bg-white px-4 py-1.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fbff]"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {loading ? <p className="text-sm text-[#64748b]">Loading volunteer applications...</p> : null}

          {!loading && !applications.length ? (
            <p className="rounded-2xl border border-dashed border-[#d5dfef] bg-[#fafcff] p-4 text-sm text-[#64748b]">
              No pending volunteer applications.
            </p>
          ) : null}

          {applications.map((application) => (
            <div key={application._id} className="rounded-2xl border border-[#e3ebfa] bg-[#fafcff] p-4">
              <p className="text-sm font-bold text-[#0f172a]">{application.fullName}</p>
              <p className="mt-1 text-xs text-[#64748b]">{application.email}</p>
              <div className="mt-2 grid gap-2 text-xs text-[#334155] sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Interest:</span> {interestLabels[application.areaOfInterest] || application.areaOfInterest}
                </p>
                <p>
                  <span className="font-semibold">Availability:</span> {application.availability}
                </p>
              </div>
              {application.notes ? (
                <p className="mt-2 text-sm text-[#475569]">{application.notes}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus(application._id, "approved")}
                  disabled={actingId === application._id}
                  className="rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {actingId === application._id ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(application._id, "rejected")}
                  disabled={actingId === application._id}
                  className="rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {actingId === application._id ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
