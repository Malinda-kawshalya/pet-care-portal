const { z } = require("zod");
const HealthEvent = require("../models/HealthEvent");
const Pet = require("../models/Pet");
const { USER_ROLES } = require("../constants/roles");
const {
  createHealthEvent,
  getHealthEventsByPet,
  getHealthEventsByAdopter,
  getHealthEvent,
  updateHealthEvent,
  completeHealthEvent,
  deleteHealthEvent,
  sendRemindersForUpcomingEvents,
} = require("../services/health-event.service");

const createHealthEventSchema = z.object({
  eventType: z.enum([
    "vaccination",
    "checkup",
    "medication",
    "vaccination_booster",
    "flea_treatment",
    "dental_cleaning",
    "surgery",
    "vaccination_rabies",
    "vaccination_dhpp",
    "vaccination_other",
    "other",
  ]),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().default(""),
  scheduledDate: z.string().transform((date) => new Date(date)),
  veterinarian: z
    .object({
      name: z.string().max(100).optional().default(""),
      clinic: z.string().max(100).optional().default(""),
      phone: z.string().max(20).optional().default(""),
    })
    .optional()
    .default({}),
  cost: z.number().min(0).nullable().optional().default(null),
  notes: z.string().max(1000).optional().default(""),
  colorCode: z
    .enum(["blue", "green", "amber", "red", "purple"])
    .optional()
    .default("blue"),
  attachments: z.array(z.string().url()).max(5).optional().default([]),
});

const updateHealthEventSchema = z.object({
  eventType: z
    .enum([
      "vaccination",
      "checkup",
      "medication",
      "vaccination_booster",
      "flea_treatment",
      "dental_cleaning",
      "surgery",
      "vaccination_rabies",
      "vaccination_dhpp",
      "vaccination_other",
      "other",
    ])
    .optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  scheduledDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  veterinarian: z
    .object({
      name: z.string().max(100).optional(),
      clinic: z.string().max(100).optional(),
      phone: z.string().max(20).optional(),
    })
    .optional(),
  cost: z.number().min(0).nullable().optional(),
  notes: z.string().max(1000).optional(),
  colorCode: z.enum(["blue", "green", "amber", "red", "purple"]).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
});

function formatHealthEvent(event) {
  if (!event) return null;

  return {
    id: event._id.toString(),
    pet: event.pet
      ? {
          id: event.pet._id.toString(),
          name: event.pet.name,
          species: event.pet.species,
          breed: event.pet.breed,
          age: event.pet.age,
          photos: event.pet.photos || [],
        }
      : null,
    adopter: event.adopter
      ? {
          id: event.adopter._id.toString(),
          fullName: event.adopter.fullName,
          email: event.adopter.email,
          role: event.adopter.role,
        }
      : null,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    scheduledDate: event.scheduledDate,
    completedDate: event.completedDate,
    veterinarian: event.veterinarian,
    cost: event.cost,
    notes: event.notes,
    isCompleted: event.isCompleted,
    createdBy: event.createdBy
      ? {
          id: event.createdBy._id.toString(),
          fullName: event.createdBy.fullName,
          email: event.createdBy.email,
          role: event.createdBy.role,
        }
      : null,
    colorCode: event.colorCode,
    attachments: event.attachments || [],
    reminderSentAt: event.reminderSentAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function createEvent(req, res) {
  const parsed = createHealthEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const { petId } = req.params;

  try {
    const pet = await Pet.findById(petId).select("_id addedBy listingType status");

    if (!pet || pet.status === "removed") {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    const isPrivileged =
      req.authUser.role === USER_ROLES.ADMIN ||
      req.authUser.role === USER_ROLES.SUPER_ADMIN ||
      req.authUser.role === USER_ROLES.VET;

    if (!isPrivileged && pet.addedBy.toString() !== req.authUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    const requestedAdopterId = req.body.adopterId || req.authUser._id.toString();

    if (requestedAdopterId.toString() !== pet.addedBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected user does not own this pet",
        code: 400,
      });
    }

    const event = await createHealthEvent({
      pet: petId,
      adopter: requestedAdopterId,
      eventType: parsed.data.eventType,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledDate: parsed.data.scheduledDate,
      veterinarian: parsed.data.veterinarian,
      cost: parsed.data.cost,
      notes: parsed.data.notes,
      createdBy: req.authUser._id,
      colorCode: parsed.data.colorCode,
    });

    return res.status(201).json({
      success: true,
      message: "Health event created successfully",
      data: {
        event: formatHealthEvent(event),
      },
    });
  } catch (error) {
    console.error("Error creating health event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create health event",
      code: 500,
    });
  }
}

async function getEventsByPet(req, res) {
  const { petId } = req.params;
  const includeCompleted = req.query.includeCompleted === "true";

  try {
    const pet = await Pet.findById(petId).select("_id addedBy listingType status");

    if (!pet || pet.status === "removed") {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    const isPrivileged =
      req.authUser.role === USER_ROLES.ADMIN ||
      req.authUser.role === USER_ROLES.SUPER_ADMIN ||
      req.authUser.role === USER_ROLES.VET;

    const isOwner = pet.addedBy.toString() === req.authUser._id.toString();

    if (!isPrivileged && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    const events = await getHealthEventsByPet(petId, includeCompleted);

    return res.status(200).json({
      success: true,
      data: {
        events: events.map(formatHealthEvent),
      },
    });
  } catch (error) {
    console.error("Error fetching health events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health events",
      code: 500,
    });
  }
}

async function getEventsByAdopter(req, res) {
  const adopterId = req.authUser._id;
  const includeCompleted = req.query.includeCompleted === "true";

  try {
    const events = await getHealthEventsByAdopter(adopterId, includeCompleted);

    return res.status(200).json({
      success: true,
      data: {
        events: events.map(formatHealthEvent),
      },
    });
  } catch (error) {
    console.error("Error fetching adopter health events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health events",
      code: 500,
    });
  }
}

async function getEventDetail(req, res) {
  const { eventId } = req.params;

  try {
    const event = await getHealthEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Health event not found",
        code: 404,
      });
    }

    // Check authorization for adopter
    if (req.authUser.role === USER_ROLES.ADOPTER && event.adopter._id.toString() !== req.authUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        event: formatHealthEvent(event),
      },
    });
  } catch (error) {
    console.error("Error fetching health event detail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health event",
      code: 500,
    });
  }
}

async function updateEvent(req, res) {
  const { eventId } = req.params;
  const parsed = updateHealthEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  try {
    const event = await getHealthEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Health event not found",
        code: 404,
      });
    }

    // Authorization check
    if (req.authUser.role === USER_ROLES.ADOPTER && event.adopter._id.toString() !== req.authUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    if (
      req.authUser.role !== USER_ROLES.ADMIN &&
      req.authUser.role !== USER_ROLES.SUPER_ADMIN &&
      req.authUser.role !== USER_ROLES.VET
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins and vets can update events",
        code: 403,
      });
    }

    const updatedEvent = await updateHealthEvent(eventId, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Health event updated successfully",
      data: {
        event: formatHealthEvent(updatedEvent),
      },
    });
  } catch (error) {
    console.error("Error updating health event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update health event",
      code: 500,
    });
  }
}

async function completeEvent(req, res) {
  const { eventId } = req.params;

  try {
    const event = await getHealthEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Health event not found",
        code: 404,
      });
    }

    // Only adopter can mark their own event as complete
    if (event.adopter._id.toString() !== req.authUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        code: 403,
      });
    }

    const completedEvent = await completeHealthEvent(eventId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Health event marked as complete",
      data: {
        event: formatHealthEvent(completedEvent),
      },
    });
  } catch (error) {
    console.error("Error completing health event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete health event",
      code: 500,
    });
  }
}

async function deleteEvent(req, res) {
  const { eventId } = req.params;

  try {
    const event = await getHealthEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Health event not found",
        code: 404,
      });
    }

    // Only admin and vet can delete events
    if (
      req.authUser.role !== USER_ROLES.ADMIN &&
      req.authUser.role !== USER_ROLES.SUPER_ADMIN &&
      req.authUser.role !== USER_ROLES.VET
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins and vets can delete events",
        code: 403,
      });
    }

    await deleteHealthEvent(eventId);

    return res.status(200).json({
      success: true,
      message: "Health event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting health event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete health event",
      code: 500,
    });
  }
}

async function triggerReminders(req, res) {
  // Only admin can trigger reminders manually
  if (req.authUser.role !== USER_ROLES.ADMIN && req.authUser.role !== USER_ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  try {
    const result = await sendRemindersForUpcomingEvents();

    return res.status(200).json({
      success: true,
      message: `Sent ${result.sent} reminder notification(s)`,
      data: result,
    });
  } catch (error) {
    console.error("Error triggering reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send reminders",
      code: 500,
    });
  }
}

module.exports = {
  createEvent,
  getEventsByPet,
  getEventsByAdopter,
  getEventDetail,
  updateEvent,
  completeEvent,
  deleteEvent,
  triggerReminders,
};
