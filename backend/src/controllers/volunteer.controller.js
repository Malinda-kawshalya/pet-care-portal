const { z } = require("zod");
const VolunteerApplication = require("../models/VolunteerApplication");

const createVolunteerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  areaOfInterest: z.enum(["shelter-care", "foster-parent", "event-support"]),
  availability: z.string().trim().min(3).max(240),
  notes: z.string().trim().max(2000).optional().default(""),
});

const reviewVolunteerSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

async function submitVolunteerApplication(req, res) {
  try {
    const parsed = createVolunteerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const application = await VolunteerApplication.create(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Volunteer application submitted successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Error submitting volunteer application:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting volunteer application",
      code: 500,
    });
  }
}

async function listVolunteerApplications(req, res) {
  try {
    const { status = "all", page = 1, limit = 20 } = req.query;
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit)));
    const normalizedPage = Math.max(1, Number(page));

    const query = {};
    if (["pending_review", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const [applications, total] = await Promise.all([
      VolunteerApplication.find(query)
        .populate("reviewedBy", "fullName role")
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit),
      VolunteerApplication.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total,
          pages: Math.ceil(total / normalizedLimit),
        },
      },
    });
  } catch (error) {
    console.error("Error listing volunteer applications:", error);
    return res.status(500).json({
      success: false,
      message: "Error listing volunteer applications",
      code: 500,
    });
  }
}

async function reviewVolunteerApplication(req, res) {
  try {
    const parsed = reviewVolunteerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const application = await VolunteerApplication.findByIdAndUpdate(
      req.params.id,
      {
        status: parsed.data.status,
        reviewedBy: req.authUser._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("reviewedBy", "fullName role");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found",
        code: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Volunteer application ${parsed.data.status}`,
      data: { application },
    });
  } catch (error) {
    console.error("Error reviewing volunteer application:", error);
    return res.status(500).json({
      success: false,
      message: "Error reviewing volunteer application",
      code: 500,
    });
  }
}

module.exports = {
  submitVolunteerApplication,
  listVolunteerApplications,
  reviewVolunteerApplication,
};
