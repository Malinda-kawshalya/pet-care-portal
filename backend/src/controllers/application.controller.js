const { z } = require("zod");
const Application = require("../models/Application");
const Pet = require("../models/Pet");
const Notification = require("../models/Notification");
const { USER_ROLES } = require("../constants/roles");
const { createNotification, listNotificationsForUser } = require("../services/notification.service");
const { sendApplicationStatusEmail } = require("../services/application-email.service");
const { generateCareGuide } = require("../services/care-guide.service");
const env = require("../config/env");

const activeStatuses = ["received", "under_review", "interview_scheduled", "reserved"];
const statusOrder = ["received", "under_review", "interview_scheduled", "reserved", "adopted", "rejected"];

const createApplicationSchema = z.object({
  petId: z.string().min(1),
  fullName: z.string().trim().min(1).max(100),
  email: z.string().email().max(100),
  phoneNumber: z.string().trim().max(20).optional().default(""),
  physicalAddress: z.string().trim().max(500).optional().default(""),
  homeType: z.enum(["apartment", "house", "farm", "other"]),
  hasOutdoorSpace: z.boolean(),
  timeAtHome: z.string().trim().max(200).optional().default(""),
  isFirstTimeOwner: z.boolean().optional().default(false),
  hasOtherPets: z.boolean().optional().default(false),
  otherPets: z.string().trim().max(200).optional().default(""),
  workSchedule: z.string().trim().max(200).optional().default(""),
  priorExperience: z.string().trim().max(1000).optional().default(""),
  reasonForAdoption: z.string().trim().min(10).max(1000),
  additionalNotes: z.string().trim().max(1000).optional().default(""),
  agreedToTerms: z.literal(true),
});

const updateStatusSchema = z.object({
  status: z.enum(["received", "under_review", "interview_scheduled", "reserved", "adopted", "rejected"]),
  note: z.string().trim().max(2000).optional().default(""),
});

function formatApplication(application) {
  return {
    id: application._id.toString(),
    pet: application.pet
      ? {
          id: application.pet._id.toString(),
          name: application.pet.name,
          species: application.pet.species,
          breed: application.pet.breed,
          age: application.pet.age,
          photos: application.pet.photos || [],
          status: application.pet.status,
        }
      : null,
    applicant: application.applicant
      ? {
          id: application.applicant._id.toString(),
          fullName: application.applicant.fullName,
          email: application.applicant.email,
          role: application.applicant.role,
        }
      : null,
    status: application.status,
    fullName: application.fullName,
    email: application.email,
    phoneNumber: application.phoneNumber,
    physicalAddress: application.physicalAddress,
    homeType: application.homeType,
    hasOutdoorSpace: application.hasOutdoorSpace,
    timeAtHome: application.timeAtHome,
    isFirstTimeOwner: application.isFirstTimeOwner,
    hasOtherPets: application.hasOtherPets,
    otherPets: application.otherPets,
    workSchedule: application.workSchedule,
    priorExperience: application.priorExperience,
    reasonForAdoption: application.reasonForAdoption,
    additionalNotes: application.additionalNotes,
    agreedToTerms: application.agreedToTerms,
    adminNotes: application.adminNotes,
    statusHistory: application.statusHistory,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function buildStatusFilterQuery(req) {
  const query = {};
  if (typeof req.query.status === "string" && req.query.status) {
    query.status = req.query.status;
  }

  if (typeof req.query.pet === "string" && req.query.pet) {
    query.pet = req.query.pet;
  }

  if (typeof req.query.startDate === "string" && req.query.startDate) {
    query.createdAt = query.createdAt || {};
    query.createdAt.$gte = new Date(req.query.startDate);
  }

  if (typeof req.query.endDate === "string" && req.query.endDate) {
    query.createdAt = query.createdAt || {};
    query.createdAt.$lte = new Date(req.query.endDate);
  }

  return query;
}

async function submitApplication(req, res) {
  const parsed = createApplicationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const pet = await Pet.findById(parsed.data.petId);

  if (!pet || pet.status !== "available") {
    return res.status(400).json({
      success: false,
      message: "This pet is not available for adoption",
      code: 400,
    });
  }

  const duplicate = await Application.findOne({
    pet: pet._id,
    applicant: req.authUser._id,
    status: { $in: activeStatuses },
  });

  if (duplicate) {
    return res.status(400).json({
      success: false,
      message: "You already have an active application for this pet",
      code: 400,
    });
  }

  const application = await Application.create({
    pet: pet._id,
    applicant: req.authUser._id,
    status: "received",
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phoneNumber: parsed.data.phoneNumber,
    physicalAddress: parsed.data.physicalAddress,
    homeType: parsed.data.homeType,
    hasOutdoorSpace: parsed.data.hasOutdoorSpace,
    timeAtHome: parsed.data.timeAtHome,
    isFirstTimeOwner: parsed.data.isFirstTimeOwner,
    hasOtherPets: parsed.data.hasOtherPets,
    otherPets: parsed.data.otherPets,
    workSchedule: parsed.data.workSchedule,
    priorExperience: parsed.data.priorExperience,
    reasonForAdoption: parsed.data.reasonForAdoption,
    additionalNotes: parsed.data.additionalNotes,
    agreedToTerms: parsed.data.agreedToTerms,
    adminNotes: [],
    statusHistory: [
      {
        status: "received",
        changedBy: req.authUser._id,
        changedAt: new Date(),
      },
    ],
  });

  const populatedApplication = await Application.findById(application._id)
    .populate({ path: "pet", select: "name species breed age photos status" })
    .populate({ path: "applicant", select: "fullName email role" });

  await createNotification({
    recipient: req.authUser._id,
    type: "application_status",
    title: "Application received",
    message: `Your adoption application for ${pet.name} has been received.`,
    link: `${env.CLIENT_ORIGIN}/dashboard`,
    metadata: {
      applicationId: application._id,
      petId: pet._id,
      status: "received",
    },
  });

  return res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: {
      application: formatApplication(populatedApplication),
    },
  });
}

async function listApplications(req, res) {
  const baseQuery = buildStatusFilterQuery(req);
  const role = req.authUser.role;

  if (role === USER_ROLES.ADOPTER) {
    baseQuery.applicant = req.authUser._id;
  } else if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  const applications = await Application.find(baseQuery)
    .sort({ createdAt: -1 })
    .populate({ path: "pet", select: "name species breed age photos status" })
    .populate({ path: "applicant", select: "fullName email role" });

  return res.status(200).json({
    success: true,
    data: {
      applications: applications.map(formatApplication),
    },
  });
}

function isValidStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return false;
  }

  const allowedTransitions = {
    received: ["under_review", "rejected"],
    under_review: ["interview_scheduled", "rejected"],
    interview_scheduled: ["reserved", "rejected"],
    reserved: ["adopted", "rejected"],
    adopted: [],
    rejected: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) || false;
}

async function updateApplicationStatus(req, res) {
  const parsed = updateStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const application = await Application.findById(req.params.id)
    .populate({ path: "pet", select: "name species breed age status" })
    .populate({ path: "applicant", select: "fullName email role" });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
      code: 404,
    });
  }

  if (!isValidStatusTransition(application.status, parsed.data.status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid application status transition",
      code: 400,
    });
  }

  application.status = parsed.data.status;
  application.statusHistory.push({
    status: parsed.data.status,
    changedBy: req.authUser._id,
    changedAt: new Date(),
  });

  if (parsed.data.status === "reserved") {
    await Pet.findByIdAndUpdate(application.pet._id, { status: "reserved" });
  }

  if (parsed.data.status === "adopted") {
    await Pet.findByIdAndUpdate(application.pet._id, { status: "adopted" });
    await generateCareGuide({
      pet: application.pet,
      adopter: application.applicant,
      application,
    });
  }

  if (parsed.data.note) {
    application.adminNotes.push({
      note: parsed.data.note,
      author: req.authUser._id,
      date: new Date(),
    });
  }

  await application.save();

  await createNotification({
    recipient: application.applicant._id,
    type: "application_status",
    title: `Application ${parsed.data.status.replace(/_/g, " ")}`,
    message: `Your application for ${application.pet.name} is now ${parsed.data.status.replace(/_/g, " ")}.`,
    link: `${env.CLIENT_ORIGIN}/dashboard`,
    metadata: {
      applicationId: application._id,
      petId: application.pet._id,
      status: parsed.data.status,
    },
  });

  await sendApplicationStatusEmail({
    to: application.applicant.email,
    petName: application.pet.name,
    status: parsed.data.status,
    dashboardUrl: `${env.CLIENT_ORIGIN}/dashboard`,
  });

  const updatedApplication = await Application.findById(application._id)
    .populate({ path: "pet", select: "name species breed age photos status" })
    .populate({ path: "applicant", select: "fullName email role" });

  return res.status(200).json({
    success: true,
    message: "Application status updated successfully",
    data: {
      application: formatApplication(updatedApplication),
    },
  });
}

async function listNotifications(req, res) {
  const notifications = await listNotificationsForUser(req.authUser._id, 20);

  return res.status(200).json({
    success: true,
    data: {
      notifications,
    },
  });
}

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus,
  listNotifications,
};
