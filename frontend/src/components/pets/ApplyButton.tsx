"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getAuthState, subscribeAuthState } from "@/lib/auth-storage";

export function ApplyButton({ petId }: { petId: string }) {
  const authState = useSyncExternalStore(subscribeAuthState, getAuthState, () => null);

  if (!authState) {
    return (
      <Link
        href="/login"
        className="inline-flex rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#2f66ff]/35"
      >
        Log in to Apply
      </Link>
    );
  }

  const canAdopt = authState.user.role === "user" || authState.user.role === "adopter";

  if (!canAdopt) {
    return null;
  }

  return (
    <Link
      href={`/applications/new?petId=${petId}`}
      className="inline-flex rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#2f66ff]/35"
    >
      Apply to Adopt
    </Link>
  );
}
