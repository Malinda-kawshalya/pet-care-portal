"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FoundPetReport {
  description: string;
  location: string;
  foundDate: string;
  contactPhone: string;
  photos?: string[];
}

export default function ReportFoundPetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FoundPetReport>({
    description: "",
    location: "",
    foundDate: new Date().toISOString().split("T")[0],
    contactPhone: "",
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
        "/pets/report-found",
        formData,
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-6">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Report Found Pet</h1>
            <p className="text-green-100 mt-2">
              Help reunite a lost pet with their family
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Thank You!
                </h2>
                <p className="text-green-700">
                  Your report has been submitted. We'll notify shelters and
                  owners of lost pets matching this description.
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
                    Pet Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the pet (species, breed, color, size, any distinctive features, etc.)"
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Found *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Address or area where pet was found"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Found *
                  </label>
                  <input
                    type="date"
                    value={formData.foundDate}
                    onChange={(e) =>
                      setFormData({ ...formData, foundDate: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Contact Phone *
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>After submitting:</strong> We'll check our database
                    of lost pets and notify potential owners. Your contact
                    information will be shared with matching reports.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
                >
                  {loading ? "Submitting..." : "Report Found Pet"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Pet Safety Steps</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Check if the pet has a collar with identification</li>
            <li>Scan for a microchip at your local veterinary clinic</li>
            <li>Contact local shelters and animal control immediately</li>
            <li>Post the pet's photo on social media and neighborhood groups</li>
            <li>Keep the pet safe in a secure location until owner is found</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
