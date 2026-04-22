import { Pet } from "@/types/pets";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export interface LostPetStatus {
  status: "lost" | "found";
  reportedDate: string;
  lastSeenDate?: string;
  contact: {
    phone: string;
    email: string;
  };
  reward: number;
  description: string;
}

export interface QRScanRecord {
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isLost: boolean;
}

export interface PublicPetProfile {
  pet: Pet;
  lostPetStatus?: LostPetStatus;
  recentScans: QRScanRecord[];
}

type NearbyPetRecord = Record<string, unknown>;
type QRScanHistoryRecord = Record<string, unknown>;

/**
 * Get public QR profile (no auth required)
 */
export async function getPublicQRProfile(
  petId: string
): Promise<PublicPetProfile> {
  const response = await fetch(`${API_BASE_URL}/qr/${petId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Pet not found");
    }
    throw new Error("Failed to fetch QR profile");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Log a QR scan
 */
export async function logQRScan(
  petId: string,
  scanData: {
    geolocation?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    notes?: string;
    isLost?: boolean;
    scannedBy?: string;
    deviceInfo?: string;
  }
): Promise<{ scanId: string }> {
  const response = await fetch(`${API_BASE_URL}/qr/${petId}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scanData),
  });

  if (!response.ok) {
    throw new Error("Failed to log QR scan");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Download QR code as PNG file
 */
export async function downloadQRCode(petId: string, petName: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/${petId}/download`);

    if (!response.ok) {
      throw new Error("Failed to download QR code");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${petName}-QR-${petId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    throw new Error("Failed to download QR code");
  }
}

/**
 * Report pet as lost (requires auth)
 */
export async function reportPetAsLost(
  petId: string,
  reportData: {
    lastSeenAddress?: string;
    lastSeenDate?: string;
    lastSeenCoordinates?: {
      longitude: number;
      latitude: number;
    };
    description?: string;
    photos?: string[];
    phone?: string;
    email?: string;
    rewardAmount?: number;
    currency?: "USD" | "EUR" | "GBP" | "CAD";
  },
  token: string
): Promise<{ lostReport: { id: string; status: string; petId: string } }> {
  const response = await fetch(`${API_BASE_URL}/qr/${petId}/lost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Failed to create lost pet report");
  }

  return payload.data;
}

/**
 * Mark lost pet as found (requires auth)
 */
export async function markPetAsFound(
  petId: string,
  foundData: {
    foundAddress?: string;
    foundCoordinates?: {
      longitude: number;
      latitude: number;
    };
    finderContact?: string;
  },
  token: string
): Promise<{ lostReport: { id: string; status: string } }> {
  const response = await fetch(`${API_BASE_URL}/qr/${petId}/found`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(foundData),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Failed to mark pet as found");
  }

  return payload.data;
}

/**
 * Get nearby lost/found pets
 */
export async function getNearbyLostPets(
  latitude: number,
  longitude: number,
  radiusMeters: number = 50000
): Promise<NearbyPetRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/qr/nearby/list?latitude=${latitude}&longitude=${longitude}&radius=${radiusMeters}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch nearby pets");
  }

  const data = await response.json();
  return data.data.pets;
}

/**
 * Get QR scan history (admin/vet only, requires auth)
 */
export async function getQRScanHistory(
  petId: string,
  options: {
    page?: number;
    limit?: number;
    isLost?: boolean;
  } = {},
  token: string
): Promise<{
  scans: QRScanHistoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const params = new URLSearchParams();
  if (options.page) params.append("page", options.page.toString());
  if (options.limit) params.append("limit", options.limit.toString());
  if (options.isLost !== undefined) params.append("isLost", options.isLost.toString());

  const response = await fetch(`${API_BASE_URL}/qr/${petId}/history?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Failed to fetch scan history");
  }

  return payload.data;
}

/**
 * Regenerate QR code (admin/vet only, requires auth)
 */
export async function regenerateQRCode(
  petId: string,
  token: string
): Promise<{ qrCodeUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/qr/${petId}/regenerate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Failed to regenerate QR code");
  }

  return payload.data;
}

/**
 * Get current location with geolocation API
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}
