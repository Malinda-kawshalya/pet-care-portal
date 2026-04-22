"use client";

import {
  getColorClass,
  getEventTypeLabel,
  getEventTypeEmoji,
  type HealthEvent,
} from "@/lib/health-events";
import { CheckCircle2, Clock } from "lucide-react";

type HealthTimelineProps = {
  events: HealthEvent[];
  onEventClick: (event: HealthEvent) => void;
  isLoading?: boolean;
};

export function HealthTimeline({ events, onEventClick, isLoading }: HealthTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Loading health events...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No health events scheduled yet.</p>
      </div>
    );
  }

  // Sort events by scheduled date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => {
        const isCompleted = event.isCompleted;
        const eventDate = new Date(event.scheduledDate);
        const today = new Date();
        const isUpcoming = eventDate > today && !isCompleted;
        const isPast = eventDate < today;

        return (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className={`w-full text-left rounded-lg border-2 p-4 transition hover:shadow-md ${
              isCompleted
                ? "border-gray-300 bg-gray-50"
                : isUpcoming
                  ? `border-${getColorClass(event.colorCode).split(" ")[0]} bg-${getColorClass(event.colorCode).split(" ")[0].replace("bg-", "")}-50`
                  : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center pt-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : isUpcoming ? (
                  <Clock className="h-6 w-6 text-blue-600" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-400" />
                )}
                {index < sortedEvents.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-gray-300" />
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getEventTypeEmoji(event.eventType)}</span>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getEventTypeLabel(event.eventType)}
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="flex-shrink-0 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Completed
                    </span>
                  )}
                </div>

                {/* Date and details */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">
                      {isCompleted ? "Completed" : "Scheduled"}
                    </p>
                    <p className="font-medium text-gray-900">
                      {eventDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {event.veterinarian?.clinic && (
                    <div>
                      <p className="text-gray-600">Clinic</p>
                      <p className="font-medium text-gray-900">{event.veterinarian.clinic}</p>
                    </div>
                  )}

                  {event.description && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-600">Details</p>
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {event.cost && (
                    <div>
                      <p className="text-gray-600">Cost</p>
                      <p className="font-medium text-gray-900">${event.cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
