"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PawPrint, User } from "lucide-react";
import { clearAuthState, getAuthState, subscribeAuthState } from "@/lib/auth-storage";
import { logoutUser } from "@/lib/auth";

export function SiteHeader() {
  const authState = useSyncExternalStore(subscribeAuthState, getAuthState, () => null);
  const isLoggedIn = Boolean(authState?.token);
  const role = authState?.user.role || null;
  const dashboardHref = role === "veterinarian" ? "/vet" : "/dashboard";

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Best-effort server logout.
    }
    clearAuthState();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#e5e9f2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-[#0f172a]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f66ff] text-white shadow-lg shadow-[#2f66ff]/30">
            <PawPrint size={18} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">PetAI</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4b5563] md:flex">
          <Link href="/" className="hover:text-[#2f66ff]">Home</Link>
          <Link href="/pets" className="hover:text-[#2f66ff]">Pets</Link>
          <Link href="/shop" className="hover:text-[#2f66ff]">Shop</Link>
          <Link href="/about" className="hover:text-[#2f66ff]">About</Link>
          <Link href="/community" className="hover:text-[#2f66ff]">Community</Link>
          <Link href="/events" className="hover:text-[#2f66ff]">Events</Link>
          <Link href="/donate" className="hover:text-[#2f66ff]">Donate</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8dfef] px-4 py-2 text-sm font-semibold text-[#1e293b]"
              >
                <User size={15} />
                Account
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#0f172a]"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-[#2f66ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2f66ff]/35"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#0f172a]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8dfef] px-4 py-2 text-sm font-semibold text-[#1e293b]"
              >
                <User size={15} />
                Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
