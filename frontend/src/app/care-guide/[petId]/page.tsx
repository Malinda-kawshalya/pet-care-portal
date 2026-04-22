"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CareGuideView } from "@/components/care-guide/CareGuideView";
import { getAuthState } from "@/lib/auth-storage";

export default function CareGuidePage() {
  const router = useRouter();
  const params = useParams<{ petId?: string }>();
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const petId = typeof params?.petId === "string" ? params.petId : "";

  useEffect(() => {
    const authState = getAuthState();

    if (!authState?.user) {
      router.replace("/login");
      return;
    }

    setRole(authState.user.role);
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Loading care guide...</p>
      </main>
    );
  }

  if (!petId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Missing pet id.</p>
      </main>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <CareGuideView petId={petId} userRole={role || "user"} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
