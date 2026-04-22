const HealthEvent = require("../models/HealthEvent");
const { createNotification } = require("./notification.service");
const env = require("../config/env");

const remindDaysBeforeDue = 7;

async function createHealthEvent({
  pet,
  adopter,
  eventType,
  title,
  description,
  scheduledDate,
  veterinarian,
  cost,
  notes,
  createdBy,
  colorCode,
}) {
  const event = await HealthEvent.create({
    pet,
    adopter,
    eventType,
    title,
    description,
    scheduledDate,
    veterinarian,
    cost,
    notes,
    createdBy,
    colorCode,
    isCompleted: false,
  });

  return event.populate([
    { path: "pet", select: "name species breed" },
    { path: "adopter", select: "fullName email" },
    { path: "createdBy", select: "fullName email role" },
  ]);
}

async function getHealthEventsByPet(petId, includeCompleted = false) {
  const query = { pet: petId };

  if (!includeCompleted) {
    query.isCompleted = false;
  }

  return HealthEvent.find(query)
    .sort({ scheduledDate: 1 })
    .populate([
      { path: "pet", select: "name species breed age photos" },
      { path: "adopter", select: "fullName email role" },
      { path: "createdBy", select: "fullName email role" },
    ]);
}

async function getHealthEventsByAdopter(adopterId, includeCompleted = false) {
  const query = { adopter: adopterId };

  if (!includeCompleted) {
    query.isCompleted = false;
  }

  return HealthEvent.find(query)
    .sort({ scheduledDate: 1 })
    .populate([
      { path: "pet", select: "name species breed age photos" },
      { path: "adopter", select: "fullName email role" },
      { path: "createdBy", select: "fullName email role" },
    ]);
}

async function getHealthEvent(eventId) {
  return HealthEvent.findById(eventId).populate([
    { path: "pet", select: "name species breed age photos healthStatus" },
    { path: "adopter", select: "fullName email phone role" },
    { path: "createdBy", select: "fullName email role" },
  ]);
}

async function updateHealthEvent(eventId, updateData) {
  const event = await HealthEvent.findByIdAndUpdate(eventId, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "pet", select: "name species breed age photos" },
    { path: "adopter", select: "fullName email role" },
    { path: "createdBy", select: "fullName email role" },
  ]);

  return event;
}

async function completeHealthEvent(eventId, adopterId) {
  const event = await HealthEvent.findById(eventId);

  if (!event) {
    throw new Error("Health event not found");
  }

  if (event.adopter.toString() !== adopterId) {
    throw new Error("Unauthorized: event does not belong to this adopter");
  }

  event.isCompleted = true;
  event.completedDate = new Date();
  await event.save();

  const updatedEvent = await event.populate([
    { path: "pet", select: "name species breed age photos" },
    { path: "adopter", select: "fullName email role" },
    { path: "createdBy", select: "fullName email role" },
  ]);

  // Create notification
  await createNotification({
    recipient: adopterId,
    type: "health_event_completed",
    title: `${event.title} marked complete`,
    message: `Health event for ${event.pet.name} has been marked as complete.`,
    link: `${env.CLIENT_ORIGIN}/pets/${event.pet._id}`,
    metadata: {
      petId: event.pet._id,
      eventId: event._id,
    },
  });

  return updatedEvent;
}

async function deleteHealthEvent(eventId) {
  return HealthEvent.findByIdAndDelete(eventId);
}

async function getUpcomingReminders() {
  const now = new Date();
  const reminderDate = new Date(now.getTime() + remindDaysBeforeDue * 24 * 60 * 60 * 1000);

  return HealthEvent.find({
    isCompleted: false,
    scheduledDate: {
      $gte: now,
      $lte: reminderDate,
    },
    reminderSentAt: null,
  }).populate([
    { path: "pet", select: "name species breed" },
    { path: "adopter", select: "fullName email" },
  ]);
}

async function sendRemindersForUpcomingEvents() {
  try {
    const events = await getUpcomingReminders();

    for (const event of events) {
      const daysUntil = Math.ceil(
        (event.scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notification
      await createNotification({
        recipient: event.adopter._id,
        type: "health_event_reminder",
        title: `Reminder: ${event.title} coming up`,
        message: `${event.pet.name} has a scheduled ${event.eventType.replace(/_/g, " ")} in ${daysUntil} days on ${event.scheduledDate.toLocaleDateString()}.`,
        link: `${env.CLIENT_ORIGIN}/pets/${event.pet._id}`,
        metadata: {
          petId: event.pet._id,
          eventId: event._id,
          daysUntil,
        },
      });

      // Mark reminder as sent
      event.reminderSentAt = new Date();
      await event.save();

      console.log(`Reminder sent for event ${event._id} (${event.title})`);
    }

    return {
      sent: events.length,
      events: events.map((e) => ({
        id: e._id,
        petName: e.pet.name,
        adopterEmail: e.adopter.email,
        title: e.title,
      })),
    };
  } catch (error) {
    console.error("Error sending health event reminders:", error);
    throw error;
  }
}

// Schedule reminder job (called from app initialization)
let reminderJobInterval = null;

function startReminderScheduler() {
  if (reminderJobInterval) {
    console.log("Reminder scheduler already running");
    return;
  }

  // Run reminder check every 6 hours
  const intervalMs = 6 * 60 * 60 * 1000;

  reminderJobInterval = setInterval(async () => {
    try {
      await sendRemindersForUpcomingEvents();
    } catch (error) {
      console.error("Failed to send reminders:", error);
    }
  }, intervalMs);

  console.log("Health event reminder scheduler started (checks every 6 hours)");

  // Also run on startup
  sendRemindersForUpcomingEvents().catch(console.error);
}

function stopReminderScheduler() {
  if (reminderJobInterval) {
    clearInterval(reminderJobInterval);
    reminderJobInterval = null;
    console.log("Health event reminder scheduler stopped");
  }
}

module.exports = {
  createHealthEvent,
  getHealthEventsByPet,
  getHealthEventsByAdopter,
  getHealthEvent,
  updateHealthEvent,
  completeHealthEvent,
  deleteHealthEvent,
  getUpcomingReminders,
  sendRemindersForUpcomingEvents,
  startReminderScheduler,
  stopReminderScheduler,
};
