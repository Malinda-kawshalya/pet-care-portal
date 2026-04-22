"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PublicQRProfile from "@/components/qr/PublicQRProfile";
import { getPublicQRProfile, logQRScan, getCurrentLocation } from "@/lib/qr";
import { Pet } from "@/types/pets";

interface QRProfile {
  pet: Pet;
  lostPetStatus?: any;
  recentScans: any[];
}

export default function QRProfilePage() {
  const params = useParams();
  const petId = typeof params.petId === "string" ? params.petId : "";

  const [profile, setProfile] = useState<QRProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the profile
        const data = await getPublicQRProfile(petId);
        setProfile(data);

        // Try to log scan with geolocation
        try {
          const location = await getCurrentLocation();
          const deviceInfo = (() => {
            const ua = navigator.userAgent;
            if (/android/i.test(ua)) return "Android";
            if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
            if (/windows/i.test(ua)) return "Windows";
            if (/mac/i.test(ua)) return "macOS";
            if (/linux/i.test(ua)) return "Linux";
            return "Unknown";
          })();

          await logQRScan(petId, {
            geolocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            },
            deviceInfo,
          });
        } catch (geoError) {
          // Silently fail geolocation logging - not critical
          console.warn("Could not log geolocation:", geoError);
          
          // Still try to log without geolocation
          const deviceInfo = (() => {
            const ua = navigator.userAgent;
            if (/android/i.test(ua)) return "Android";
            if (/iphone|ipad|ipot/i.test(ua)) return "iOS";
            if (/windows/i.test(ua)) return "Windows";
            if (/mac/i.test(ua)) return "macOS";
            if (/linux/i.test(ua)) return "Linux";
            return "Unknown";
          })();

          await logQRScan(petId, { deviceInfo });
        }
      } catch (err) {
        console.error("Error loading QR profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load QR profile"
        );
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      loadProfile();
    }
  }, [petId]);

  if (!petId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Missing pet id.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Loading pet profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pet Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The pet profile you're looking for doesn't exist."}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <PublicQRProfile
      pet={profile.pet}
      lostPetStatus={profile.lostPetStatus}
      recentScans={profile.recentScans}
    />
  );
}
