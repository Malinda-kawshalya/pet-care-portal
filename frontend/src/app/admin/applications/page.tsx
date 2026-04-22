"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fetchApplications, updateApplicationStatus } from "@/lib/applications";
import { getAuthState } from "@/lib/auth-storage";
import type { Application, ApplicationStatus } from "@/types/applications";

const statusOptions: Array<ApplicationStatus | ""> = [
  "",
  "received",
  "under_review",
  "interview_scheduled",
  "reserved",
  "adopted",
  "rejected",
];

const statusBadgeColors: Record<ApplicationStatus, string> = {
  received: "bg-[#e5e7eb] text-[#475569]",
  under_review: "bg-[#dbeafe] text-[#2563eb]",
  interview_scheduled: "bg-[#fef3c7] text-[#b45309]",
  reserved: "bg-[#ffedd5] text-[#ea580c]",
  adopted: "bg-[#dcfce7] text-[#15803d]",
  rejected: "bg-[#fee2e2] text-[#b91c1c]",
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [pet, setPet] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchApplications({ status, pet, startDate, endDate });
      setApplications(data);
      setStatuses((current) => {
        const next: Record<string, ApplicationStatus> = {};
        data.forEach((application) => {
          next[application.id] = current[application.id] || application.status;
        });
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load applications");
    } finally {
      setLoading(false);
    }
  }, [status, pet, startDate, endDate]);

  useEffect(() => {
    const authState = getAuthState();
    if (
      !authState?.token ||
      authState.user.role !== "super_admin"
    ) {
      router.replace("/login");
      return;
    }

    void loadApplications();
  }, [loadApplications, router]);

  async function handleSave(applicationId: string) {
    setSavingId(applicationId);
    setError("");

    try {
      const updated = await updateApplicationStatus(applicationId, {
        status: statuses[applicationId],
        note: notes[applicationId],
      });

      if (updated) {
        setApplications((current) =>
          current.map((application) => (application.id === applicationId ? updated : application))
        );
      }

      setNotes((current) => ({ ...current, [applicationId]: "" }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update application");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">Administrator Tools</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Application Dashboard</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Filter adoption applications, change status, and attach internal notes.
          </p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#dbe4f4] bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ApplicationStatus | "")}
              className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-[#64748b]"
            >
              {statusOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? option.replace(/_/g, " ") : "All statuses"}
                </option>
              ))}
            </select>
            <input
              value={pet}
              onChange={(event) => setPet(event.target.value)}
              placeholder="Pet ID"
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
            />
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-[#e2e8f0] px-4 py-3"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void loadApplications()}
              className="rounded-full bg-[#2f66ff] px-5 py-2 text-sm font-semibold text-white"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setPet("");
                setStartDate("");
                setEndDate("");
              }}
              className="rounded-full border border-[#d1d9ea] px-5 py-2 text-sm font-semibold text-[#0f172a]"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}

        <section className="mt-8 space-y-5">
          {loading ? (
            <p className="text-sm text-[#64748b]">Loading applications...</p>
          ) : (
            applications.map((application) => (
              <article
                key={application.id}
                className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                      {application.applicant?.fullName || "Unknown applicant"}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#0f172a]">
                      {application.pet?.name || "Unknown pet"}
                    </h2>
                    <p className="mt-1 text-sm text-[#64748b]">
                      {application.pet ? `${application.pet.species} • ${application.pet.breed}` : "Pet details unavailable"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColors[application.status]}`}
                  >
                    {application.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Contact</p>
                    <p className="mt-2 text-sm text-[#334155]">{application.applicant?.email}</p>
                    <p className="text-sm text-[#334155]">{application.applicant?.phoneNumber}</p>
                  </div>
                  <div className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Home & Experience</p>
                    <p className="mt-2 text-sm text-[#334155]">
                      {application.homeType} • {application.isFirstTimeOwner ? "First-time owner" : "Experienced"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Living Situation</p>
                    <p className="mt-2 text-sm text-[#334155]">
                      {application.hasOutdoorSpace ? "Has yard" : "No outdoor space"} • {application.hasOtherPets ? "Other pets" : "No other pets"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Created</p>
                    <p className="mt-2 text-sm text-[#334155]">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Reason for Adoption</p>
                  <p className="mt-2 text-sm text-[#334155]">{application.reasonForAdoption}</p>
                </div>

                {application.additionalNotes ? (
                  <div className="mt-3 rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Additional Notes</p>
                    <p className="mt-2 text-sm text-[#334155]">{application.additionalNotes}</p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-[0.45fr_0.55fr]">
                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Status
                    <select
                      value={statuses[application.id]}
                      onChange={(event) =>
                        setStatuses((current) => ({
                          ...current,
                          [application.id]: event.target.value as ApplicationStatus,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    >
                      {statusOptions
                        .filter((option): option is ApplicationStatus => Boolean(option))
                        .map((option) => (
                          <option key={option} value={option}>
                            {option.replace(/_/g, " ")}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Internal note
                    <textarea
                      rows={3}
                      value={notes[application.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [application.id]: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    />
                  </label>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSave(application.id)}
                    disabled={savingId === application.id}
                    className="rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {savingId === application.id ? "Saving..." : "Save Update"}
                  </button>
                </div>
              </article>
            ))
          )}

          {!loading && !applications.length ? (
            <div className="rounded-[2rem] border border-dashed border-[#cbd5e1] bg-white p-8 text-sm text-[#64748b]">
              No applications match the current filters.
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
