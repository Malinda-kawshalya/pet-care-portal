const { z } = require("zod");
const CareGuide = require("../models/CareGuide");
const Application = require("../models/Application");
const Pet = require("../models/Pet");
const { USER_ROLES } = require("../constants/roles");
const {
  generateCareGuide,
  getActiveGuide,
  generatePdfContent,
  createVetAuthoredGuide,
  listPendingGuides,
  approveGuide,
} = require("../services/care-guide.service");

function formatCareGuide(guide) {
  if (!guide) {
    return null;
  }

  return {
    id: guide._id.toString(),
    pet: guide.pet
      ? {
          id: guide.pet._id.toString(),
          name: guide.pet.name,
          species: guide.pet.species,
          breed: guide.pet.breed,
          age: guide.pet.age,
          photos: guide.pet.photos || [],
          healthStatus: guide.pet.healthStatus,
        }
      : null,
    adopter: guide.adopter
      ? {
          id: guide.adopter._id.toString(),
          fullName: guide.adopter.fullName,
          email: guide.adopter.email,
          role: guide.adopter.role,
        }
      : null,
    content: guide.content,
    sourceType: guide.sourceType,
    author: guide.author
      ? {
          id: guide.author._id.toString(),
          fullName: guide.author.fullName,
          email: guide.author.email,
          role: guide.author.role,
        }
      : null,
    approvalStatus: guide.approvalStatus,
    approvedBy: guide.approvedBy
      ? {
          id: guide.approvedBy._id.toString(),
          fullName: guide.approvedBy.fullName,
          email: guide.approvedBy.email,
          role: guide.approvedBy.role,
        }
      : null,
    approvedAt: guide.approvedAt,
    vetVerified: guide.vetVerified,
    verifiedBy: guide.verifiedBy
      ? {
          id: guide.verifiedBy._id.toString(),
          fullName: guide.verifiedBy.fullName,
          email: guide.verifiedBy.email,
          role: guide.verifiedBy.role,
        }
      : null,
    verifiedAt: guide.verifiedAt,
    version: guide.version,
    archived: guide.archived,
    createdAt: guide.createdAt,
    updatedAt: guide.updatedAt,
  };
}

async function listGuides(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const verified = typeof req.query.verified === "string" ? req.query.verified : "";

  const query = { archived: false };
  if (verified === "true") {
    query.vetVerified = true;
  }
  if (verified === "false") {
    query.vetVerified = false;
  }

  const [totalCount, guides] = await Promise.all([
    CareGuide.countDocuments(query),
    CareGuide.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "pet", select: "name species breed age photos healthStatus" })
      .populate({ path: "adopter", select: "fullName email role" })
      .populate({ path: "verifiedBy", select: "fullName email role" })
      .populate({ path: "author", select: "fullName email role" })
      .populate({ path: "approvedBy", select: "fullName email role" }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      guides: guides.map(formatCareGuide),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function getGuide(req, res) {
  const isAdopter = req.authUser.role === USER_ROLES.ADOPTER;
  const guide = await getActiveGuide(req.params.petId, req.authUser._id, {
    includePending: !isAdopter,
  });

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: "Care guide not found",
      code: 404,
    });
  }

  if (req.authUser.role === USER_ROLES.ADOPTER && guide.adopter.id.toString() !== req.authUser._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      guide: formatCareGuide(guide),
    },
  });
}

async function regenerateGuide(req, res) {
  const pet = await Pet.findById(req.params.petId);

  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  const application = await Application.findOne({
    pet: pet._id,
    status: "adopted",
  }).populate("applicant");

  if (!application) {
    return res.status(400).json({
      success: false,
      message: "No adopted application found for this pet",
      code: 400,
    });
  }

  const guide = await generateCareGuide({
    pet,
    adopter: application.applicant,
    application,
  });

  const populatedGuide = await CareGuide.findById(guide._id)
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });

  return res.status(201).json({
    success: true,
    message: "Care guide regenerated successfully",
    data: {
      guide: formatCareGuide(populatedGuide),
    },
  });
}

async function verifyGuide(req, res) {
  const guide = await CareGuide.findOne({ pet: req.params.petId, archived: false })
    .sort({ version: -1 })
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" });

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: "Care guide not found",
      code: 404,
    });
  }

  guide.vetVerified = true;
  guide.verifiedBy = req.authUser._id;
  guide.verifiedAt = new Date();
  await guide.save();

  const updatedGuide = await CareGuide.findById(guide._id)
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });

  return res.status(200).json({
    success: true,
    message: "Care guide verified successfully",
    data: {
      guide: formatCareGuide(updatedGuide),
    },
  });
}

async function exportPdf(req, res) {
  const guide = await CareGuide.findOne({ pet: req.params.petId, archived: false })
    .sort({ version: -1 })
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" });

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: "Care guide not found",
      code: 404,
    });
  }

  if (req.authUser.role === USER_ROLES.ADOPTER && guide.adopter._id.toString() !== req.authUser._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  try {
    // For PDF export, use simple HTML to plain text approach
    // In production, integrate with a PDF library like `pdf-lib` or `pdfkit`
    const { fileName } = generatePdfContent(guide);

    // Send the markdown content as PDF (will require html2pdf library in production)
    // For now, send as a text file that can be converted
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(".pdf", ".md")}"`);
    res.send(guide.content);
  } catch (error) {
    console.error("PDF export error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export care guide as PDF",
      code: 500,
    });
  }
}

async function submitVetGuide(req, res) {
  const bodySchema = z.object({
    content: z.string().trim().min(40).max(12000),
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const pet = await Pet.findById(req.params.petId).populate({ path: "addedBy", select: "fullName email role" });
  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  let adopter = pet.addedBy;
  if (!adopter || adopter.role !== USER_ROLES.USER) {
    const adoptedApplication = await Application.findOne({
      pet: pet._id,
      status: "adopted",
    }).populate({ path: "applicant", select: "fullName email role" });

    adopter = adoptedApplication?.applicant || adopter;
  }

  if (!adopter || adopter.role !== USER_ROLES.USER) {
    return res.status(400).json({
      success: false,
      message: "A pet owner is required before submitting a guide",
      code: 400,
    });
  }
  const guide = await createVetAuthoredGuide({
    pet,
    adopter,
    authorId: req.authUser._id,
    content: parsed.data.content,
  });

  const populatedGuide = await CareGuide.findById(guide._id)
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });

  return res.status(201).json({
    success: true,
    message: "Guide submitted for admin approval",
    data: {
      guide: formatCareGuide(populatedGuide),
    },
  });
}

async function listPendingGuidesHandler(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const payload = await listPendingGuides({ page, limit });

  return res.status(200).json({
    success: true,
    data: {
      guides: payload.guides.map(formatCareGuide),
      page: payload.page,
      limit: payload.limit,
      totalCount: payload.totalCount,
      totalPages: payload.totalPages,
    },
  });
}

async function approveGuideHandler(req, res) {
  const guide = await approveGuide(req.params.guideId, req.authUser._id, "approved");

  return res.status(200).json({
    success: true,
    message: "Guide approved successfully",
    data: {
      guide: formatCareGuide(guide),
    },
  });
}

async function rejectGuideHandler(req, res) {
  const guide = await approveGuide(req.params.guideId, req.authUser._id, "rejected");

  return res.status(200).json({
    success: true,
    message: "Guide rejected successfully",
    data: {
      guide: formatCareGuide(guide),
    },
  });
}

module.exports = {
  listGuides,
  getGuide,
  regenerateGuide,
  verifyGuide,
  exportPdf,
  submitVetGuide,
  listPendingGuidesHandler,
  approveGuideHandler,
  rejectGuideHandler,
};
