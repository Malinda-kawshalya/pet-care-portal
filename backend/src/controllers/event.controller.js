const { z } = require("zod");
const Event = require("../models/Event");
const { USER_ROLES } = require("../constants/roles");

const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4000).optional().default(""),
    location: z.string().trim().max(200).optional().default(""),
    eventType: z
      .enum(["meetup", "workshop", "adoption_drive", "awareness", "other"])
      .optional()
      .default("other"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional().default(null),
  })
  .refine((payload) => !payload.endsAt || payload.endsAt >= payload.startsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  });

function toPublicEvent(event) {
  return {
    id: event._id.toString(),
    title: event.title,
    description: event.description,
    location: event.location,
    eventType: event.eventType,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    approvalStatus: event.approvalStatus,
    approvedBy: event.approvedBy
      ? {
          id: event.approvedBy._id?.toString() || event.approvedBy.toString(),
          fullName: event.approvedBy.fullName,
          role: event.approvedBy.role,
        }
      : null,
    approvedAt: event.approvedAt,
    createdBy: event.createdBy
      ? {
          id: event.createdBy._id?.toString() || event.createdBy.toString(),
          fullName: event.createdBy.fullName,
          role: event.createdBy.role,
        }
      : null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function listEvents(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const nowOnly = req.query.nowOnly !== "false";

  const query = {
    isDeleted: false,
    approvalStatus: "approved",
    ...(nowOnly ? { startsAt: { $gte: new Date() } } : {}),
  };

  const [totalCount, events] = await Promise.all([
    Event.countDocuments(query),
    Event.find(query)
      .populate({ path: "createdBy", select: "fullName role" })
      .populate({ path: "approvedBy", select: "fullName role" })
      .sort({ startsAt: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      events: events.map(toPublicEvent),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function listMyEvents(req, res) {
  const events = await Event.find({ isDeleted: false, createdBy: req.authUser._id })
    .populate({ path: "createdBy", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: {
      events: events.map(toPublicEvent),
    },
  });
}

async function createEvent(req, res) {
  const parsed = createEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const isSuperAdmin = req.authUser.role === USER_ROLES.SUPER_ADMIN;

  const event = await Event.create({
    ...parsed.data,
    createdBy: req.authUser._id,
    approvalStatus: isSuperAdmin ? "approved" : "pending_approval",
    approvedBy: isSuperAdmin ? req.authUser._id : null,
    approvedAt: isSuperAdmin ? new Date() : null,
  });

  const hydrated = await Event.findById(event._id)
    .populate({ path: "createdBy", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" });

  return res.status(201).json({
    success: true,
    message: isSuperAdmin
      ? "Event created and published"
      : "Event submitted successfully. It will be published after admin approval.",
    data: {
      event: toPublicEvent(hydrated),
    },
  });
}

async function listPendingEvents(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const query = {
    isDeleted: false,
    approvalStatus: "pending_approval",
  };

  const [totalCount, events] = await Promise.all([
    Event.countDocuments(query),
    Event.find(query)
      .populate({ path: "createdBy", select: "fullName role" })
      .populate({ path: "approvedBy", select: "fullName role" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      events: events.map(toPublicEvent),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function approveEvent(req, res) {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
      code: 404,
    });
  }

  event.approvalStatus = "approved";
  event.approvedBy = req.authUser._id;
  event.approvedAt = new Date();
  await event.save();

  const hydrated = await Event.findById(event._id)
    .populate({ path: "createdBy", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" });

  return res.status(200).json({
    success: true,
    message: "Event approved successfully",
    data: {
      event: toPublicEvent(hydrated),
    },
  });
}

async function rejectEvent(req, res) {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
      code: 404,
    });
  }

  event.approvalStatus = "rejected";
  event.approvedBy = req.authUser._id;
  event.approvedAt = new Date();
  await event.save();

  const hydrated = await Event.findById(event._id)
    .populate({ path: "createdBy", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" });

  return res.status(200).json({
    success: true,
    message: "Event rejected successfully",
    data: {
      event: toPublicEvent(hydrated),
    },
  });
}

module.exports = {
  listEvents,
  listMyEvents,
  createEvent,
  listPendingEvents,
  approveEvent,
  rejectEvent,
};
