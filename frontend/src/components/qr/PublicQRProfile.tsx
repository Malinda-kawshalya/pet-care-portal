"use client";

import { AlertTriangle, Check, MapPin, Shield, Clock } from "lucide-react";
import { Pet } from "@/types/pets";
import QRDisplay from "@/components/qr/QRDisplay";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface PublicQRProfileProps {
  pet: Pet;
  lostPetStatus?: {
    status: "lost" | "found";
    reportedDate: string;
    lastSeenDate?: string;
    contact: {
      phone: string;
      email: string;
    };
    reward: number;
    description: string;
  };
  recentScans?: Array<{
    timestamp: string;
    geolocation?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    isLost: boolean;
  }>;
}

export default function PublicQRProfile({
  pet,
  lostPetStatus,
  recentScans = [],
}: PublicQRProfileProps) {
  const isLost = lostPetStatus?.status === "lost";
  const isFound = lostPetStatus?.status === "found";

  const handleReportFound = async () => {
    if (!pet.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/qr/${pet.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLost: true,
          scannedBy: "Found Pet Report",
          notes: "Reported as found via QR scan",
        }),
      });

      if (!response.ok) throw new Error("Failed to report");
      alert("Thank you! The owner has been notified.");
      window.location.reload();
    } catch (error) {
      console.error("Error reporting pet:", error);
      alert("Failed to report. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Banner */}
      {isLost && (
        <div className="bg-red-50 border-b-2 border-red-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-red-900 font-semibold">
                {pet.name} is Missing!
              </h2>
              <p className="text-red-700 text-sm">
                If you&apos;ve seen this pet, please contact the owner immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {isFound && (
        <div className="bg-green-50 border-b-2 border-green-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h2 className="text-green-900 font-semibold">
                {pet.name} has been found!
              </h2>
              <p className="text-green-700 text-sm">
                This pet has been reported as found.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Pet Info Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Primary Photo */}
          {pet.photos && pet.photos.length > 0 && (
            <div className="relative h-64 md:h-96 w-full bg-gray-200">
              <img
                src={pet.photos[0]}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
              {isLost && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  MISSING
                </div>
              )}
            </div>
          )}

          {/* Pet Details */}
          <div className="p-6 md:p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{pet.name}</h1>
            <p className="text-xl text-gray-600 mb-6">
              {pet.breed} • {pet.age} years old • {pet.species}
            </p>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b">
              <div>
                <p className="text-gray-600 text-sm font-medium">Breed</p>
                <p className="text-gray-900 font-semibold">{pet.breed}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Age</p>
                <p className="text-gray-900 font-semibold">{pet.age} years</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Gender</p>
                <p className="text-gray-900 font-semibold capitalize">
                  {pet.gender}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Color</p>
                <p className="text-gray-900 font-semibold">{pet.colour}</p>
              </div>
            </div>

            {/* Description */}
            {pet.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About {pet.name}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {pet.description}
                </p>
              </div>
            )}

            <div className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Unique QR Code</h3>
              <p className="mb-4 text-sm text-gray-600">
                This is {pet.name}&apos;s unique QR code. Scanning it opens this exact profile.
              </p>
              <QRDisplay
                petId={pet.id}
                petName={pet.name}
                qrCodeUrl={pet.qrCodeUrl || undefined}
                isDownloadable={true}
              />
            </div>

            {/* Lost Pet Info */}
            {lostPetStatus && (
              <div className={`p-6 rounded-lg mb-8 ${
                isLost
                  ? "bg-red-50 border-2 border-red-200"
                  : "bg-green-50 border-2 border-green-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isLost ? "text-red-900" : "text-green-900"
                }`}>
                  {isLost ? "Missing Pet Report" : "Found Pet Information"}
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className={`text-sm font-medium ${
                      isLost ? "text-red-700" : "text-green-700"
                    }`}>
                      Reported Date
                    </p>
                    <p className="text-gray-900">
                      {new Date(lostPetStatus.reportedDate).toLocaleDateString()}
                    </p>
                  </div>

                  {lostPetStatus.description && (
                    <div>
                      <p className={`text-sm font-medium ${
                        isLost ? "text-red-700" : "text-green-700"
                      }`}>
                        Details
                      </p>
                      <p className="text-gray-900">
                        {lostPetStatus.description}
                      </p>
                    </div>
                  )}

                  {isLost && lostPetStatus.reward > 0 && (
                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">
                        💰 Reward Offered
                      </p>
                      <p className="text-xl font-bold text-yellow-600">
                        ${lostPetStatus.reward}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className={`text-sm font-medium mb-2 ${
                      isLost ? "text-red-700" : "text-green-700"
                    }`}>
                      Contact Information
                    </p>
                    <div className="space-y-2">
                      {lostPetStatus.contact.phone &&
                        lostPetStatus.contact.phone !== "Not provided" && (
                          <p className="flex items-center gap-2 text-gray-900">
                            <span className="text-lg">📞</span>
                            <a
                              href={`tel:${lostPetStatus.contact.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lostPetStatus.contact.phone}
                            </a>
                          </p>
                        )}
                      {lostPetStatus.contact.email &&
                        lostPetStatus.contact.email !== "Not provided" && (
                          <p className="flex items-center gap-2 text-gray-900">
                            <span className="text-lg">📧</span>
                            <a
                              href={`mailto:${lostPetStatus.contact.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lostPetStatus.contact.email}
                            </a>
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {isLost && (
                  <button
                    onClick={handleReportFound}
                    className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ I Found This Pet
                  </button>
                )}
              </div>
            )}

            {/* Recent Scan Activity */}
            {recentScans.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Scan Activity
                </h3>
                <div className="space-y-3">
                  {recentScans.slice(0, 5).map((scan, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(scan.timestamp).toLocaleString()}
                            </p>
                            {scan.geolocation && (
                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {scan.geolocation.latitude.toFixed(4)}, {scan.geolocation.longitude.toFixed(4)}
                                {scan.geolocation.accuracy && (
                                  <span>
                                    (±{Math.round(scan.geolocation.accuracy)}m)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        {scan.isLost && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            Lost Report
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex gap-4">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Privacy Notice</h3>
            <p className="text-blue-800 text-sm">
              This is a public profile for {pet.name}. Personal information of the owner has been masked for privacy.
              If you have information about this pet, please contact the provided phone or email directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
