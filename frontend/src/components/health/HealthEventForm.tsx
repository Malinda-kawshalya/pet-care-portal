"use client";

import { useState } from "react";
import {
  type EventType,
  type ColorCode,
  type HealthEvent,
  getEventTypeLabel,
} from "@/lib/health-events";
import { X } from "lucide-react";

const EVENT_TYPES: EventType[] = [
  "vaccination",
  "vaccination_rabies",
  "vaccination_dhpp",
  "vaccination_booster",
  "vaccination_other",
  "checkup",
  "medication",
  "flea_treatment",
  "dental_cleaning",
  "surgery",
  "other",
];

const COLOR_CODES: ColorCode[] = ["blue", "green", "amber", "red", "purple"];

type HealthEventFormProps = {
  event?: HealthEvent | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function HealthEventForm({
  event,
  onSubmit,
  onCancel,
  isLoading,
}: HealthEventFormProps) {
  const [formData, setFormData] = useState({
    eventType: (event?.eventType || "checkup") as EventType,
    title: event?.title || "",
    description: event?.description || "",
    scheduledDate: event
      ? new Date(event.scheduledDate).toISOString().split("T")[0]
      : "",
    veterinarian: {
      name: event?.veterinarian?.name || "",
      clinic: event?.veterinarian?.clinic || "",
      phone: event?.veterinarian?.phone || "",
    },
    cost: event?.cost ? String(event.cost) : "",
    notes: event?.notes || "",
    colorCode: (event?.colorCode || "blue") as ColorCode,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.scheduledDate) {
      setError("Date is required");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Event Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Event Type *
        </label>
        <select
          value={formData.eventType}
          onChange={(e) =>
            setFormData({ ...formData, eventType: e.target.value as EventType })
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {getEventTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="e.g., Annual Checkup"
          maxLength={100}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Add any additional details..."
          maxLength={1000}
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Scheduled Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Scheduled Date *
        </label>
        <input
          type="date"
          value={formData.scheduledDate}
          onChange={(e) =>
            setFormData({ ...formData, scheduledDate: e.target.value })
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Veterinarian Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Veterinarian Information</h4>

        <div className="space-y-3">
          {/* Vet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={formData.veterinarian.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  veterinarian: { ...formData.veterinarian, name: e.target.value },
                })
              }
              placeholder="Veterinarian name"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Clinic */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Clinic
            </label>
            <input
              type="text"
              value={formData.veterinarian.clinic}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  veterinarian: { ...formData.veterinarian, clinic: e.target.value },
                })
              }
              placeholder="Clinic name"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={formData.veterinarian.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  veterinarian: { ...formData.veterinarian, phone: e.target.value },
                })
              }
              placeholder="Phone number"
              maxLength={20}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Cost */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Cost
        </label>
        <div className="mt-2 flex items-center">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            value={formData.cost}
            onChange={(e) =>
              setFormData({ ...formData, cost: e.target.value })
            }
            placeholder="0.00"
            min="0"
            step="0.01"
            className="ml-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Color Code */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Timeline Color
        </label>
        <div className="flex gap-2">
          {COLOR_CODES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, colorCode: color })}
              className={`h-10 w-10 rounded-lg border-2 transition ${
                formData.colorCode === color
                  ? "border-gray-800"
                  : "border-gray-300"
              } ${
                {
                  blue: "bg-blue-500",
                  green: "bg-green-500",
                  amber: "bg-amber-500",
                  red: "bg-red-500",
                  purple: "bg-purple-500",
                }[color]
              }`}
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Additional notes or observations..."
          maxLength={1000}
          rows={2}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
        </button>
      </div>
    </form>
  );
}
