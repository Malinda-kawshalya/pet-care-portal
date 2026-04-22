"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { apiClient } from "@/lib/api";
import { clearAuthState, getAuthState } from "@/lib/auth-storage";
import { fetchApplications, fetchNotifications } from "@/lib/applications";
import { fetchCurrentUser } from "@/lib/auth";
import { AdminPetsPanel } from "@/components/admin/AdminPetsPanel";
import { AdminApplicationsPanel } from "@/components/admin/AdminApplicationsPanel";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { AdminQRPanel } from "@/components/admin/AdminQRPanel";
import { AdminCommunityPanel } from "@/components/admin/AdminCommunityPanel";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminVolunteerPanel } from "@/components/admin/AdminVolunteerPanel";
import type { Application, Notification } from "@/types/applications";
import type { AuthUser } from "@/types/auth";
import {
  CalendarDays,
  Cog,
  FileText,
  Grid2x2,
  MessageSquare,
  PawPrint,
  QrCode,
  ShoppingBag,
  Users,
} from "lucide-react";

interface AdminStats {
  totalPets: number;
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  totalCareGuides: number;
  pendingSuccessStories: number;
  pendingVolunteerApplications: number;
}

type AdminView = "overview" | "pets" | "products" | "applications" | "qr" | "community" | "volunteers" | "settings";

const roleTitles: Record<string, string> = {
  super_admin: "Super Admin Dashboard",
  user: "Adopter Dashboard",
  veterinarian: "Vet Dashboard",
};

const roleLabels: Record<string, string> = {
  user: "Adopter",
  veterinarian: "Vet",
  super_admin: "Super Admin",
};

const statusColors: Record<string, { chip: string; border: string; background: string }> = {
  received: { chip: "bg-[#e5e7eb] text-[#475569]", border: "border-[#d1d5db]", background: "bg-[#f8fafc]" },
  under_review: { chip: "bg-[#dbeafe] text-[#2563eb]", border: "border-[#bfdbfe]", background: "bg-[#eff6ff]" },
  interview_scheduled: { chip: "bg-[#fef3c7] text-[#b45309]", border: "border-[#fde68a]", background: "bg-[#fffbeb]" },
  reserved: { chip: "bg-[#ffedd5] text-[#ea580c]", border: "border-[#fed7aa]", background: "bg-[#fff7ed]" },
  adopted: { chip: "bg-[#dcfce7] text-[#15803d]", border: "border-[#bbf7d0]", background: "bg-[#f0fdf4]" },
  rejected: { chip: "bg-[#fee2e2] text-[#b91c1c]", border: "border-[#fecaca]", background: "bg-[#fff1f2]" },
};

const adminSidebarLinks: Array<{ label: string; view: AdminView; icon: typeof Grid2x2 }> = [
  { label: "Overview", view: "overview", icon: Grid2x2 },
  { label: "Pets", view: "pets", icon: PawPrint },
  { label: "Products", view: "products", icon: ShoppingBag },
  { label: "Applications", view: "applications", icon: FileText },
  { label: "QR Codes", view: "qr", icon: QrCode },
  { label: "Community", view: "community", icon: MessageSquare },
  { label: "Volunteers", view: "volunteers", icon: Users },
  { label: "Settings", view: "settings", icon: Cog },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [activeAdminView, setActiveAdminView] = useState<AdminView>("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const title = useMemo(() => {
    if (!user) {
      return "Dashboard";
    }

    return roleTitles[user.role] || "Dashboard";
  }, [user]);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      router.replace("/login");
      return;
    }

    let active = true;

    async function loadDashboard() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!active) {
          return;
        }

        setUser(currentUser);

        if (currentUser.role === "user") {
          const [apps, notes] = await Promise.all([fetchApplications(), fetchNotifications()]);
          if (!active) {
            return;
          }

          setApplications(apps);
          setNotifications(notes);
        } else if (currentUser.role === "veterinarian") {
          router.replace("/vet");
          return;
        } else if (currentUser.role === "super_admin") {
          const response = (await apiClient.get("/admin/stats", {
            auth: true,
          })) as { data?: { stats?: AdminStats } };

          if (!active) {
            return;
          }

          setAdminStats(response.data?.stats ?? null);
          setApplications([]);
          setNotifications([]);
        } else {
          setApplications([]);
          setNotifications([]);
        }
      } catch {
        if (!active) {
          return;
        }

        clearAuthState();
        setError("Session expired. Please log in again.");
        router.replace("/login");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const adopterSummary = useMemo(() => {
    return applications.reduce(
      (accumulator, application) => {
        accumulator.total += 1;
        accumulator[application.status] = (accumulator[application.status] || 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        received: 0,
        under_review: 0,
        interview_scheduled: 0,
        reserved: 0,
        adopted: 0,
        rejected: 0,
      } as Record<string, number>
    );
  }, [applications]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Loading dashboard...</p>
        {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const adminStatCards = [
    {
      title: "Active Pets",
      value: adminStats?.totalPets ?? 0,
      trend: "+5% from last month",
    },
    {
      title: "Pending Applications",
      value: adminStats?.pendingApplications ?? 0,
      trend: "+2 from yesterday",
    },
    {
      title: "Pending Success Stories",
      value: adminStats?.pendingSuccessStories ?? 0,
      trend: "Needs moderation",
    },
    {
      title: "Volunteer Applications",
      value: adminStats?.pendingVolunteerApplications ?? 0,
      trend: "Awaiting review",
    },
    {
      title: "Adoptions This Month",
      value: adminStats?.totalApplications ?? 0,
      trend: "+8% from last month",
    },
  ];

  const renderAdminContent = () => {
    switch (activeAdminView) {
      case "overview":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {adminStatCards.map((card) => (
                <article key={card.title} className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
                  <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#64748b]">{card.title}</p>
                  <p className="mt-2 text-6xl font-extrabold leading-none text-[#0f172a]">{card.value}</p>
                  <div className="mt-4 inline-flex rounded-xl bg-[#e8f9ef] px-3 py-1.5 text-sm font-semibold text-[#0f8b61]">
                    {card.trend}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <section className="rounded-3xl border border-[#d8deee] bg-white shadow-sm">
                <header className="border-b border-[#edf2ff] px-6 py-4">
                  <h2 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">Recent Applications</h2>
                </header>
                <div className="overflow-x-auto px-6 py-4">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-[#edf2ff] text-xs uppercase tracking-[0.1em] text-[#94a3b8]">
                        <th className="py-3">Metric</th>
                        <th className="py-3">Value</th>
                        <th className="py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-[#334155]">
                      <tr className="border-b border-[#f1f5f9]">
                        <td className="py-4 font-semibold text-[#0f172a]">Total Users</td>
                        <td className="py-4">{adminStats?.totalUsers ?? 0}</td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => setActiveAdminView("applications")}
                            className="font-semibold text-[#2f66ff] hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#f1f5f9]">
                        <td className="py-4 font-semibold text-[#0f172a]">Pending Applications</td>
                        <td className="py-4">{adminStats?.pendingApplications ?? 0}</td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => setActiveAdminView("applications")}
                            className="font-semibold text-[#2f66ff] hover:underline"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 font-semibold text-[#0f172a]">Pending Success Stories</td>
                        <td className="py-4">{adminStats?.pendingSuccessStories ?? 0}</td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => setActiveAdminView("community")}
                            className="font-semibold text-[#2f66ff] hover:underline"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#f1f5f9]">
                        <td className="py-4 font-semibold text-[#0f172a]">Volunteer Applications</td>
                        <td className="py-4">{adminStats?.pendingVolunteerApplications ?? 0}</td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => setActiveAdminView("volunteers")}
                            className="font-semibold text-[#2f66ff] hover:underline"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 font-semibold text-[#0f172a]">Published Care Guides</td>
                        <td className="py-4">{adminStats?.totalCareGuides ?? 0}</td>
                        <td className="py-4">
                          <Link href="/admin/care-guides" className="font-semibold text-[#2f66ff] hover:underline">
                            Open
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm">
                <h2 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">Monthly Adoption Trends</h2>
                <div className="mt-5 space-y-4">
                  <TrendBar label="Applications" value={adminStats?.totalApplications ?? 0} max={100} />
                  <TrendBar label="Pending" value={adminStats?.pendingApplications ?? 0} max={100} />
                  <TrendBar label="Story Queue" value={adminStats?.pendingSuccessStories ?? 0} max={100} />
                  <TrendBar label="Volunteer Queue" value={adminStats?.pendingVolunteerApplications ?? 0} max={100} />
                  <TrendBar label="Care Guides" value={adminStats?.totalCareGuides ?? 0} max={100} />
                </div>
                <Link
                  href="/admin/events"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f3f6fd] px-4 py-2.5 text-sm font-semibold text-[#214dbf] hover:bg-[#e9eefc]"
                >
                  <CalendarDays size={16} /> Open Event Moderation
                </Link>
              </section>
            </div>
          </>
        );

      case "pets":
        return <AdminPetsPanel />;

      case "applications":
        return <AdminApplicationsPanel />;

      case "products":
        return <AdminProductsPanel />;

      case "qr":
        return <AdminQRPanel />;

      case "community":
        return <AdminCommunityPanel />;

      case "volunteers":
        return <AdminVolunteerPanel />;

      case "settings":
        return <AdminSettingsPanel />;

      default:
        return null;
    }
  };

  if (user.role === "super_admin") {
    return (
      <div className="min-h-screen bg-[#eef2f9]">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1240px] px-3 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <aside className="rounded-3xl border border-[#d8deee] bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-fit">
              <div className="mb-5 flex items-center gap-3 border-b border-[#edf2ff] pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2f8] text-xl">
                  🗂
                </div>
                <div>
                  <p className="text-3xl font-bold leading-none text-[#0f172a]">PetAI</p>
                  <p className="text-sm text-[#64748b]">Admin</p>
                </div>
              </div>

              <nav className="space-y-1">
                {adminSidebarLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeAdminView === item.view;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveAdminView(item.view)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#edf2ff] text-[#2857e8]"
                          : "text-[#334155] hover:bg-[#f5f8ff]"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="space-y-5">
              <div className="rounded-[2rem] border border-[#9ca8ff] bg-gradient-to-r from-[#2f66ff] to-[#4a2fd9] p-6 text-white shadow-lg shadow-[#2f66ff]/20 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-5xl font-extrabold tracking-tight">Admin Dashboard</h1>
                    <p className="mt-2 text-lg text-blue-100">
                      Manage your platform, users, and adorable pets.
                    </p>
                  </div>
                  <Link
                    href="/admin/pets"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-lg font-bold text-[#2d56e8] transition hover:-translate-y-0.5"
                  >
                    + Add New Pet
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-[#d8deee] bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAdminView("overview")}
                    className={`rounded-xl px-6 py-2.5 text-base font-semibold ${
                      activeAdminView === "overview"
                        ? "bg-[#edf2ff] text-[#2857e8]"
                        : "text-[#64748b] hover:bg-[#f5f8ff]"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAdminView("applications")}
                    className={`rounded-xl px-6 py-2.5 text-base font-semibold ${
                      activeAdminView === "applications"
                        ? "bg-[#edf2ff] text-[#2857e8]"
                        : "text-[#64748b] hover:bg-[#f5f8ff]"
                    }`}
                  >
                    User Management
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAdminView("community")}
                    className={`rounded-xl px-6 py-2.5 text-base font-semibold ${
                      activeAdminView === "community"
                        ? "bg-[#edf2ff] text-[#2857e8]"
                        : "text-[#64748b] hover:bg-[#f5f8ff]"
                    }`}
                  >
                    Success Stories
                  </button>
                </div>
              </div>

              {renderAdminContent()}
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#dce6fa] bg-white p-8 shadow-xl shadow-[#2f66ff]/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2f66ff]">Signed in</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0f172a]">{title}</h1>
          <p className="mt-2 text-[#475569]">
            Welcome, {user.fullName}. Your role is <strong>{roleLabels[user.role] || user.role}</strong>.
          </p>

          {user.role === "user" ? (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <SummaryCard title="Applications" value={String(adopterSummary.total)} />
                <SummaryCard
                  title="In Progress"
                  value={String(
                    adopterSummary.received +
                      adopterSummary.under_review +
                      adopterSummary.interview_scheduled +
                      adopterSummary.reserved
                  )}
                />
                <SummaryCard title="Completed" value={String(adopterSummary.adopted)} />
              </div>

              <section className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-[#0f172a]">Your Applications</h2>
                  <Link href="/pets" className="text-sm font-semibold text-[#2f66ff]">
                    Browse pets
                  </Link>
                </div>

                <div className="mt-5 grid gap-4">
                  {applications.map((application) => {
                    const style = statusColors[application.status];
                    return (
                      <article
                        key={application.id}
                        className={`rounded-2xl border ${style.border} ${style.background} p-5`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#0f172a]">
                              {application.pet?.name || "Unknown pet"}
                            </h3>
                            <p className="text-sm text-[#475569]">
                              {application.pet
                                ? `${application.pet.species} • ${application.pet.breed}`
                                : "Pet details unavailable"}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}>
                            {application.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <InfoChip label="Home" value={application.homeType} />
                          <InfoChip label="Outdoor Space" value={application.hasOutdoorSpace ? "Yes" : "No"} />
                          <InfoChip label="Updated" value={new Date(application.updatedAt).toLocaleDateString()} />
                          <InfoChip label="Next Step" value={getNextStep(application.status)} />
                        </div>

                        {application.status === "adopted" && application.pet ? (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            <Link
                              href={`/care-guide/${application.pet?.id || ""}`}
                              className="inline-block rounded-lg bg-[#2f66ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e4bb8]"
                            >
                              View Care Guide
                            </Link>
                            <Link
                              href={`/health/${application.pet?.id || ""}`}
                              className="inline-block rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d]"
                            >
                              Health Timeline
                            </Link>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}

                  {!applications.length ? (
                    <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b]">
                      You have no applications yet.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="mt-8 rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-[#0f172a]">Recent Notifications</h2>
                <div className="mt-4 space-y-3">
                  {notifications.map((notification) => (
                    <article key={notification._id} className="rounded-2xl border border-[#edf2fb] bg-[#fafcff] p-4">
                      <p className="text-sm font-semibold text-[#0f172a]">{notification.title}</p>
                      <p className="mt-1 text-sm text-[#64748b]">{notification.message}</p>
                    </article>
                  ))}
                  {!notifications.length ? (
                    <p className="text-sm text-[#64748b]">No notifications yet.</p>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function TrendBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-semibold text-[#334155]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#edf2ff]">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-[#2f66ff] to-[#5d3bdb]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe5fb] bg-[#f8fbff] p-4">
      <p className="text-xs font-semibold text-[#2f66ff]">{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#0f172a]">{value}</p>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{label}</p>
      <p className="mt-1 font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function getNextStep(status: Application["status"]) {
  const steps: Record<Application["status"], string> = {
    received: "Awaiting review",
    under_review: "Under shelter review",
    interview_scheduled: "Prepare for interview",
    reserved: "Waiting final adoption",
    adopted: "Completed",
    rejected: "Closed",
  };

  return steps[status];
}
