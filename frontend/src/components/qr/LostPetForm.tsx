"use client";

import { useState } from "react";
import { AlertCircle, MapPin, Phone, DollarSign } from "lucide-react";

interface LostPetFormProps {
  petId: string;
  petName: string;
  onSubmit: (data: LostPetReportData) => Promise<void>;
  isLoading?: boolean;
}

export interface LostPetReportData {
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
}

export default function LostPetForm({
  petId,
  petName,
  onSubmit,
  isLoading = false,
}: LostPetFormProps) {
  const [formData, setFormData] = useState<LostPetReportData>({
    currency: "USD",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "rewardAmount" ? Number(value) : value,
    });
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lastSeenCoordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          setGeoError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGeoError(
            "Failed to get location. Please enter the address manually or check permissions."
          );
        }
      );
    } else {
      setGeoError("Geolocation is not supported in your browser");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({ currency: "USD" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report pet as lost");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Report {petName} as Lost</h3>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">Lost pet report created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Last Seen Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1" />
            Last Seen Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="lastSeenAddress"
              placeholder="Street address, city, state"
              value={formData.lastSeenAddress || ""}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleGetLocation}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm"
            >
              Use GPS
            </button>
          </div>
          {geoError && <p className="text-red-600 text-sm mt-1">{geoError}</p>}
          {formData.lastSeenCoordinates && (
            <p className="text-gray-600 text-sm mt-1">
              📍 {formData.lastSeenCoordinates.latitude.toFixed(4)}, {formData.lastSeenCoordinates.longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Last Seen Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Seen Date
          </label>
          <input
            type="datetime-local"
            name="lastSeenDate"
            value={formData.lastSeenDate || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Last Seen Details
          </label>
          <textarea
            name="description"
            placeholder="Where was {petName} last seen? Any circumstances? What was it wearing or carrying?"
            value={formData.description || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={1000}
          />
          <p className="text-gray-500 text-xs mt-1">
            {(formData.description || "").length}/1000 characters
          </p>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline w-4 h-4 mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Reward */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Reward Amount (Optional)
            </label>
            <input
              type="number"
              name="rewardAmount"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.rewardAmount || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? "Creating Report..." : success ? "Report Created!" : "Report as Lost"}
        </button>
      </form>
    </div>
  );
}
