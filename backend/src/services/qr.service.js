const Pet = require("../models/Pet");
const QRScan = require("../models/QRScan");
const LostPet = require("../models/LostPet");
const Notification = require("../models/Notification");
const { generateQRCode } = require("../utils/qr");

function maskPhoneNumber(phone = "") {
  const digitsOnly = String(phone).replace(/\D/g, "");
  if (digitsOnly.length < 4) {
    return "Not provided";
  }

  const visibleTail = digitsOnly.slice(-4);
  const maskedBody = "*".repeat(Math.max(0, digitsOnly.length - 4));
  return `${maskedBody}${visibleTail}`;
}

function maskEmailAddress(email = "") {
  const value = String(email).trim();
  if (!value.includes("@")) {
    return "Not provided";
  }

  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return "Not provided";
  }

  const visiblePrefix = localPart.slice(0, Math.min(2, localPart.length));
  const hiddenCount = Math.max(1, localPart.length - visiblePrefix.length);
  return `${visiblePrefix}${"*".repeat(hiddenCount)}@${domainPart}`;
}

function getFirstName(fullName = "") {
  const first = String(fullName).trim().split(/\s+/)[0];
  return first || "Owner";
}

/**
 * Log a QR code scan
 * @param {string} petId - Pet ID
 * @param {object} scanData - Scan information (ipAddress, userAgent, geolocation, notes)
 * @returns {Promise<object>} - QRScan document
 */
async function logQRScan(petId, scanData = {}) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new Error("Pet not found");
    }

    const qrScan = await QRScan.create({
      pet: petId,
      petName: pet.name,
      ipAddress: scanData.ipAddress || "",
      userAgent: scanData.userAgent || "",
      geolocation: scanData.geolocation || null,
      deviceInfo: scanData.deviceInfo || "",
      isLost: scanData.isLost || false,
      scannedBy: scanData.scannedBy || "",
      notes: scanData.notes || "",
    });

    // Check if this is a lost pet scan and notify owner
    if (scanData.isLost) {
      const lostPet = await LostPet.findOne({
        pet: petId,
        status: "lost",
        isActive: true,
      });

      if (lostPet) {
        // Create notification for lost pet owner
        await Notification.create({
          recipient: lostPet.owner,
          type: "lost-pet-scan",
          title: `Potential sighting of ${pet.name}!`,
          message: `Your lost pet ${pet.name} QR code was scanned! 
            Location: ${scanData.geolocation?.latitude}, ${scanData.geolocation?.longitude}
            Time: ${new Date().toLocaleString()}`,
          entityType: "LostPet",
          entityId: lostPet._id,
          relatedData: {
            petId,
            scanId: qrScan._id,
            location: scanData.geolocation,
          },
          isRead: false,
        });
      }
    }

    return qrScan;
  } catch (error) {
    console.error("Error logging QR scan:", error);
    throw error;
  }
}

/**
 * Get QR scan history for a pet (admin/vet only)
 * @param {string} petId - Pet ID
 * @param {object} options - Pagination and filtering
 * @returns {Promise<object>} - Scans and metadata
 */
async function getQRScanHistory(petId, options = {}) {
  try {
    const { page = 1, limit = 20, isLost = null } = options;
    const skip = (page - 1) * limit;

    const query = { pet: petId };
    if (isLost !== null) {
      query.isLost = isLost;
    }

    const [scans, total] = await Promise.all([
      QRScan.find(query)
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QRScan.countDocuments(query),
    ]);

    return {
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching QR scan history:", error);
    throw error;
  }
}

/**
 * Get public pet profile (masked PII)
 * @param {string} petId - Pet ID
 * @returns {Promise<object>} - Pet profile with masked personal info
 */
async function getPublicPetProfile(petId) {
  try {
    const qrCodeUrl = await ensureQRCodeExists(petId);

    const pet = await Pet.findById(petId).select(
      "name species breed age gender colour description photos status qrCodeUrl"
    );

    if (!pet) {
      throw new Error("Pet not found");
    }

    // Get lost pet information if exists
    const lostPetInfo = await LostPet.findOne({
      pet: petId,
      status: { $in: ["lost", "found"] },
      isActive: true,
    })
      .populate("owner", "fullName phone")
      .lean();

    // Get recent scan activity (last 5)
    const recentScans = await QRScan.find({ pet: petId })
      .sort({ scannedAt: -1 })
      .limit(5)
      .select("geolocation scannedAt isLost")
      .lean();

    return {
      pet: {
        ...pet.toObject(),
        qrCodeUrl: pet.qrCodeUrl || qrCodeUrl,
      },
      lostPetStatus: lostPetInfo
        ? {
            status: lostPetInfo.status,
            reportedDate: lostPetInfo.reportedDate,
            lastSeenDate: lostPetInfo.lastSeenDate,
            ownerFirstName: getFirstName(lostPetInfo.owner?.fullName),
            contact: {
              phone: maskPhoneNumber(
                lostPetInfo.contactInfo?.phone || lostPetInfo.owner?.phone || ""
              ),
              email: maskEmailAddress(lostPetInfo.contactInfo?.email || ""),
            },
            reward: lostPetInfo.reward?.amount || 0,
            description: lostPetInfo.description,
          }
        : null,
      recentScans: recentScans.map((scan) => ({
        timestamp: scan.scannedAt,
        geolocation: scan.geolocation,
        isLost: scan.isLost,
      })),
    };
  } catch (error) {
    console.error("Error fetching public pet profile:", error);
    throw error;
  }
}

/**
 * Create a lost pet report
 * @param {string} petId - Pet ID
 * @param {string} userId - Owner/Reporter User ID
 * @param {object} reportData - Lost pet information
 * @returns {Promise<object>} - LostPet document
 */
async function createLostPetReport(petId, userId, reportData = {}) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new Error("Pet not found");
    }

    // Check if already reported as lost
    const existingLost = await LostPet.findOne({
      pet: petId,
      status: "lost",
      isActive: true,
    });

    if (existingLost) {
      throw new Error("Pet already has an active lost report");
    }

    const lostPet = await LostPet.create({
      pet: petId,
      owner: userId,
      status: "lost",
      reportedDate: new Date(),
      lastSeenDate: reportData.lastSeenDate || null,
      lastSeenLocation: {
        address: reportData.lastSeenAddress || "",
        coordinates: reportData.lastSeenCoordinates || null,
      },
      description: reportData.description || "",
      photos: reportData.photos || [],
      contactInfo: {
        phone: reportData.phone || "",
        email: reportData.email || "",
      },
      reward: {
        amount: reportData.rewardAmount || 0,
        currency: reportData.currency || "USD",
      },
      isActive: true,
    });

    // Notify admins about new lost pet report
    const User = require("../models/User");
    const admins = await User.find({ role: "super_admin" }).select("_id");

    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: "lost-pet-report",
        title: `New lost pet report: ${pet.name}`,
        message: `A new lost pet report has been filed for ${pet.name}. Location: ${reportData.lastSeenAddress || "Not provided"}`,
        entityType: "LostPet",
        entityId: lostPet._id,
      });
    }

    return lostPet;
  } catch (error) {
    console.error("Error creating lost pet report:", error);
    throw error;
  }
}

/**
 * Mark a lost pet as found
 * @param {string} lostPetId - LostPet ID
 * @param {string} foundById - User ID who found the pet
 * @param {object} foundData - Found location and details
 * @returns {Promise<object>} - Updated LostPet document
 */
async function markPetAsFound(lostPetId, foundById, foundData = {}) {
  try {
    const lostPet = await LostPet.findByIdAndUpdate(
      lostPetId,
      {
        status: "found",
        foundDate: new Date(),
        foundBy: foundById,
        foundLocation: {
          address: foundData.foundAddress || "",
          coordinates: foundData.foundCoordinates || null,
        },
        isActive: false,
      },
      { new: true }
    );

    if (!lostPet) {
      throw new Error("Lost pet report not found");
    }

    // Notify owner that pet was found
    await Notification.create({
      recipient: lostPet.owner,
      type: "lost-pet-found",
      title: `Good news! ${lostPet.petName} has been found!`,
      message: `Your pet has been found at ${foundData.foundAddress || "a location"}. Please contact the finder at ${foundData.finderContact || "the provided contact"}`,
      entityType: "LostPet",
      entityId: lostPet._id,
    });

    return lostPet;
  } catch (error) {
    console.error("Error marking pet as found:", error);
    throw error;
  }
}

/**
 * Get nearby lost/found pets within radius
 * @param {object} coordinates - GeoJSON coordinates [longitude, latitude]
 * @param {number} radiusMeters - Search radius in meters
 * @returns {Promise<array>} - Nearby lost/found pets
 */
async function getNearbyLostPets(coordinates, radiusMeters = 50000) {
  try {
    const lostPets = await LostPet.find({
      $or: [
        {
          "lastSeenLocation.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates,
              },
              $maxDistance: radiusMeters,
            },
          },
          status: "lost",
          isActive: true,
        },
        {
          "foundLocation.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates,
              },
              $maxDistance: radiusMeters,
            },
          },
          status: "found",
        },
      ],
    })
      .populate("pet", "name species breed photos")
      .limit(20)
      .lean();

    return lostPets;
  } catch (error) {
    console.error("Error finding nearby lost pets:", error);
    throw error;
  }
}

/**
 * Generate QR code for pet if not already generated
 * @param {string} petId - Pet ID
 * @returns {Promise<string>} - QR code URL
 */
async function ensureQRCodeExists(petId) {
  try {
    let pet = await Pet.findById(petId);

    if (!pet) {
      throw new Error("Pet not found");
    }

    // If QR code already exists, return it
    if (pet.qrCodeUrl) {
      return pet.qrCodeUrl;
    }

    // Generate new QR code
    const qrCodeUrl = await generateQRCode(petId);

    // Update pet with QR code
    pet = await Pet.findByIdAndUpdate(
      petId,
      { qrCodeUrl },
      { new: true }
    );

    return pet.qrCodeUrl;
  } catch (error) {
    console.error("Error ensuring QR code exists:", error);
    throw error;
  }
}

module.exports = {
  logQRScan,
  getQRScanHistory,
  getPublicPetProfile,
  createLostPetReport,
  markPetAsFound,
  getNearbyLostPets,
  ensureQRCodeExists,
};
