"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getHealthEventsByPet, createHealthEvent, type HealthEvent } from "@/lib/health-events";
import { HealthTimeline } from "./HealthTimeline";
import { HealthEventModal } from "./HealthEventModal";
import { HealthEventForm } from "./HealthEventForm";

type HealthEventsViewProps = {
  petId: string;
  userRole: string;
};

export function HealthEventsView({ petId, userRole }: HealthEventsViewProps) {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HealthEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!petId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getHealthEventsByPet(petId, includeCompleted);
      setEvents(response.data?.events || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load health events"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [petId, includeCompleted]);

  const handleCreateEvent = async (data: any) => {
    try {
      await createHealthEvent(petId, data);
      setIsCreating(false);
      await loadEvents();
    } catch (err) {
      throw err;
    }
  };

  const handleEventClick = (event: HealthEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Timeline</h2>
          <p className="mt-1 text-gray-600">
            Track and manage health events and vaccinations
          </p>
        </div>
        {(userRole === "super_admin" || userRole === "veterinarian") && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Event
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Create Health Event
          </h3>
          <HealthEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setIsCreating(false)}
            isLoading={loading}
          />
        </div>
      )}

      {/* Filters */}
      {events.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show completed events
          </label>
        </div>
      )}

      {/* Timeline */}
      <HealthTimeline
        events={events}
        onEventClick={handleEventClick}
        isLoading={loading}
      />

      {/* Modal */}
      <HealthEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={(updatedEvent) => {
          setEvents(
            events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
          );
          loadEvents();
        }}
        userRole={userRole}
      />
    </div>
  );
}
