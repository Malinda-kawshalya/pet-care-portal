const User = require("../models/User");
const Pet = require("../models/Pet");
const Application = require("../models/Application");
const CareGuide = require("../models/CareGuide");
const Post = require("../models/Post");
const VolunteerApplication = require("../models/VolunteerApplication");

const pendingApplicationStatuses = [
  "received",
  "under_review",
  "interview_scheduled",
  "reserved",
];

async function getAdminStats(_req, res) {
  const [
    totalPets,
    totalUsers,
    totalApplications,
    pendingApplications,
    totalCareGuides,
    pendingSuccessStories,
    pendingVolunteerApplications,
  ] =
    await Promise.all([
      Pet.countDocuments({}),
      User.countDocuments({}),
      Application.countDocuments({}),
      Application.countDocuments({ status: { $in: pendingApplicationStatuses } }),
      CareGuide.countDocuments({}),
      Post.countDocuments({
        category: "success-stories",
        approvalStatus: "pending_approval",
        isDeleted: false,
      }),
      VolunteerApplication.countDocuments({ status: "pending_review" }),
    ]);

  return res.status(200).json({
    success: true,
    data: {
      stats: {
        totalPets,
        totalUsers,
        totalApplications,
        pendingApplications,
        totalCareGuides,
        pendingSuccessStories,
        pendingVolunteerApplications,
      },
    },
  });
}

module.exports = {
  getAdminStats,
};
