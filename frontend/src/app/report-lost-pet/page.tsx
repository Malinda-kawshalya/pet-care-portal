"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LostPetReport {
  petId: string;
  description: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  contactPhone: string;
  rewardAmount?: number;
}

export default function ReportLostPetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LostPetReport>({
    petId: "",
    description: "",
    lastSeenLocation: "",
    lastSeenDate: new Date().toISOString().split("T")[0],
    contactPhone: "",
    rewardAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(
        "/pets/report-lost",
        {
          ...formData,
          rewardAmount: formData.rewardAmount || 0,
        },
        { auth: true }
      );
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit report";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-6">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Report Lost Pet</h1>
            <p className="text-red-100 mt-2">
              Help reunite your pet with your family
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Report Submitted Successfully!
                </h2>
                <p className="text-green-700">
                  We'll notify shelters and the community about your lost pet.
                  Redirecting you to dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet ID (if registered in our system)
                  </label>
                  <input
                    type="text"
                    value={formData.petId}
                    onChange={(e) =>
                      setFormData({ ...formData, petId: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your pet (breed, color, distinctive features, etc.)"
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Seen Location *
                  </label>
                  <input
                    type="text"
                    value={formData.lastSeenLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastSeenLocation: e.target.value,
                      })
                    }
                    placeholder="Address or area where pet was last seen"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Seen Date *
                  </label>
                  <input
                    type="date"
                    value={formData.lastSeenDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastSeenDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPhone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.rewardAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardAmount: e.target.value ? parseInt(e.target.value) : 0,
                      })
                    }
                    placeholder="Amount in USD"
                    min="0"
                    step="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>After submitting:</strong> We'll notify all shelters
                    in the network and add your pet to our missing pet alerts.
                    Community members will be notified to help locate your pet.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-semibold"
                >
                  {loading ? "Submitting..." : "Report Lost Pet"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-2">Tips for Finding Your Pet</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Check nearby shelters and veterinary clinics immediately</li>
            <li>Post on social media and neighborhood groups</li>
            <li>Contact local microchip registries if your pet is microchipped</li>
            <li>Leave familiar items outside your home</li>
            <li>Update your pet identification information</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
