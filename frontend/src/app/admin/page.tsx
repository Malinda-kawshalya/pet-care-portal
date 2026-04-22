"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import {
  BadgeCheck,
  Boxes,
  CalendarDays,
  Cog,
  FileText,
  Grid2x2,
  Heart,
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

const sidebarLinks = [
  { label: "Overview", href: "/admin", icon: Grid2x2 },
  { label: "Pets", href: "/admin/pets", icon: PawPrint },
  { label: "Products", href: "/admin/shop-approvals", icon: ShoppingBag },
  { label: "Applications", href: "/admin/applications", icon: FileText },
  { label: "QR Codes", href: "/qr", icon: QrCode },
  { label: "Community", href: "/community", icon: MessageSquare },
  { label: "Settings", href: "/settings/notifications", icon: Cog },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = (await apiClient.get("/admin/stats", {
          auth: true,
        })) as {
          data?: { stats?: AdminStats };
        };
        setStats(response.data?.stats ?? null);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Active Pets",
      value: stats?.totalPets ?? 0,
      hint: "Shelter-wide availability",
      icon: PawPrint,
      trend: "+5% from last month",
    },
    {
      label: "Pending Applications",
      value: stats?.pendingApplications ?? 0,
      hint: "Needs admin review",
      icon: FileText,
      trend: "+2 from yesterday",
    },
    {
      label: "Pending Success Stories",
      value: stats?.pendingSuccessStories ?? 0,
      hint: "Needs admin moderation",
      icon: MessageSquare,
      trend: "Review queue",
    },
    {
      label: "Volunteer Applications",
      value: stats?.pendingVolunteerApplications ?? 0,
      hint: "Awaiting response",
      icon: Users,
      trend: "New volunteer interest",
    },
    {
      label: "Total Applications",
      value: stats?.totalApplications ?? 0,
      hint: "All-time submissions",
      icon: Heart,
      trend: "+8% from last month",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f6fd] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#d8dff0] bg-white p-6 text-center text-[#334155] shadow-sm">
            Loading admin dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fd] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-[#d8dff0] bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-fit">
          <div className="mb-5 flex items-center gap-3 border-b border-[#e9eef9] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f66ff] text-white">
              <PawPrint size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-[#0f172a]">PetAI</p>
              <p className="text-sm text-[#64748b]">Admin</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === 0;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#edf2ff] text-[#2857e8]"
                      : "text-[#334155] hover:bg-[#f3f6fd]"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-[#d8dff0] bg-gradient-to-r from-[#2f66ff] to-[#4c2fd7] p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-base text-blue-100 sm:text-lg">
                  Manage your platform, users, and adorable pets.
                </p>
              </div>
              <Link
                href="/add-pet"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#2b57e8] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                + Add New Pet
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#d8dff0] bg-white p-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#edf2ff] px-5 py-2.5 text-sm font-semibold text-[#2857e8]"
              >
                Overview
              </button>
              <button
                type="button"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8faff]"
              >
                User Management
              </button>
              <Link
                href="/success-stories"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8faff]"
              >
                Success Stories
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-3xl border border-[#d8dff0] bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748b]">
                      {card.label}
                    </p>
                    <div className="rounded-lg bg-[#f3f6fd] p-2 text-[#2f66ff]">
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold leading-none text-[#0f172a]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-[#64748b]">{card.hint}</p>
                  <div className="mt-4 inline-flex rounded-lg bg-[#e9fbf3] px-3 py-1 text-sm font-semibold text-[#0f8b61]">
                    {card.trend}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-3xl border border-[#d8dff0] bg-white shadow-sm">
              <header className="border-b border-[#edf2ff] px-6 py-4">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
                  Recent Activity
                </h2>
              </header>

              <div className="divide-y divide-[#edf2ff] px-6 py-2">
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4">
                  <div>
                    <p className="font-semibold text-[#0f172a]">
                      Platform users
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Total registered user accounts
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold text-[#2f66ff]">
                    {stats?.totalUsers ?? 0}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4">
                  <div>
                    <p className="font-semibold text-[#0f172a]">Care guides</p>
                    <p className="text-sm text-[#64748b]">
                      AI drafts and verified educational guides
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold text-[#2f66ff]">
                    {stats?.totalCareGuides ?? 0}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4">
                  <div>
                    <p className="font-semibold text-[#0f172a]">
                      Pending approvals
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Includes adoption, stories, and volunteer requests
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold text-[#2f66ff]">
                    {(stats?.pendingApplications ?? 0) + (stats?.pendingSuccessStories ?? 0) + (stats?.pendingVolunteerApplications ?? 0)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#d8dff0] bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
                Quick Access
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/admin/vet-verification"
                  className="flex items-center gap-3 rounded-xl border border-[#e7ecfb] bg-[#f9fbff] px-4 py-3 text-sm font-semibold text-[#214dbf] hover:bg-[#edf2ff]"
                >
                  <BadgeCheck size={16} /> Verify Care Guides
                </Link>
                <Link
                  href="/admin/care-guides"
                  className="flex items-center gap-3 rounded-xl border border-[#e7ecfb] bg-[#f9fbff] px-4 py-3 text-sm font-semibold text-[#214dbf] hover:bg-[#edf2ff]"
                >
                  <Boxes size={16} /> Care Guide Approvals
                </Link>
                <Link
                  href="/admin/events"
                  className="flex items-center gap-3 rounded-xl border border-[#e7ecfb] bg-[#f9fbff] px-4 py-3 text-sm font-semibold text-[#214dbf] hover:bg-[#edf2ff]"
                >
                  <CalendarDays size={16} /> Event Moderation
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-xl border border-[#e7ecfb] bg-[#f9fbff] px-4 py-3 text-sm font-semibold text-[#214dbf] hover:bg-[#edf2ff]"
                >
                  <Users size={16} /> Back to User Dashboard
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
