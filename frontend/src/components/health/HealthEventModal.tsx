"use client";

import { useState } from "react";
import { X, Trash2, CheckCircle2 } from "lucide-react";
import { HealthEventForm } from "./HealthEventForm";
import {
  completeHealthEvent,
  deleteHealthEvent,
  type HealthEvent,
} from "@/lib/health-events";

type HealthEventModalProps = {
  event: HealthEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: HealthEvent) => void;
  userRole: string;
};

export function HealthEventModal({
  event,
  isOpen,
  onClose,
  onSave,
  userRole,
}: HealthEventModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await completeHealthEvent(event.id);
      onSave(event); // Refresh will happen in parent
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteHealthEvent(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    // In a real app, this would call updateHealthEvent
    // For now, just close the modal
    setIsEditing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Event" : "Event Details"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isEditing ? (
              <HealthEventForm
                event={event}
                onSubmit={handleSave}
                onCancel={() => setIsEditing(false)}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-6">
                {/* Event Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Event Type</p>
                    <p className="mt-1 text-gray-900">{event.eventType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Title</p>
                    <p className="mt-1 text-gray-900">{event.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled Date</p>
                    <p className="mt-1 text-gray-900">
                      {new Date(event.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="mt-1 text-gray-900">
                      {event.isCompleted ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="mt-2 text-gray-900">{event.description}</p>
                  </div>
                )}

                {/* Veterinarian Info */}
                {(event.veterinarian?.name ||
                  event.veterinarian?.clinic ||
                  event.veterinarian?.phone) && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Veterinarian Information
                    </h4>
                    {event.veterinarian?.name && (
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {event.veterinarian.name}
                      </p>
                    )}
                    {event.veterinarian?.clinic && (
                      <p className="text-gray-700">
                        <span className="font-medium">Clinic:</span> {event.veterinarian.clinic}
                      </p>
                    )}
                    {event.veterinarian?.phone && (
                      <p className="text-gray-700">
                        <span className="font-medium">Phone:</span> {event.veterinarian.phone}
                      </p>
                    )}
                  </div>
                )}

                {event.cost && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cost</p>
                    <p className="mt-1 text-gray-900">${event.cost.toFixed(2)}</p>
                  </div>
                )}

                {event.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Notes</p>
                    <p className="mt-2 text-gray-900">{event.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-between pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    {(userRole === "super_admin" || userRole === "veterinarian") && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Edit Event
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isLoading}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {!event.isCompleted && (
                    <button
                      onClick={handleComplete}
                      disabled={isLoading}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
