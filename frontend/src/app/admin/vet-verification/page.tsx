"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";

interface CareGuide {
  id: string;
  pet: {
    id: string;
    name: string;
  } | null;
  content: string;
  createdAt: string;
  verifiedAt?: string;
}

export default function VetVerificationPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await apiClient.get("/care-guide", { auth: true });
        setGuides((response.data as { data?: { guides?: CareGuide[] } })?.data?.guides || []);
      } catch (err) {
        console.error("Error fetching care guides:", err);
        setError("Failed to load care guides for verification");
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const handleVerify = async (guide: CareGuide) => {
    if (!guide.pet?.id) {
      return;
    }

    try {
      await apiClient.patch(`/care-guide/${guide.pet.id}/verify`, {}, { auth: true });
      setGuides(
        guides.map((g) =>
          g.id === guide.id ? { ...g, verifiedAt: new Date().toISOString() } : g
        )
      );
    } catch (err) {
      console.error("Error verifying guide:", err);
      alert("Failed to verify care guide");
    }
  };

  if (loading)
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading care guides...</div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Care Guide Verification
          </h1>
          <Link href="/admin/pets" className="text-blue-600 hover:underline">
            Back to Super Admin
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {guides.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No care guides awaiting verification
            </div>
          ) : (
            guides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white rounded-lg shadow-md p-6 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {guide.pet?.name || "Unknown pet"}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Created:{" "}
                      {new Date(guide.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {guide.verifiedAt ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose max-w-none mb-6 text-gray-700 whitespace-pre-wrap rounded bg-gray-50 p-4">
                  {guide.content}
                </div>

                {!guide.verifiedAt && (
                  <button
                    onClick={() => handleVerify(guide)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Verify Guide
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
