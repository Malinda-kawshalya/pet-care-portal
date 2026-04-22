const { z } = require("zod");
const Pet = require("../models/Pet");
const QRScan = require("../models/QRScan");
const LostPet = require("../models/LostPet");
const { generateQRCodeBuffer } = require("../utils/qr");
const {
  logQRScan,
  getQRScanHistory,
  getPublicPetProfile,
  createLostPetReport,
  markPetAsFound,
  getNearbyLostPets,
  ensureQRCodeExists,
} = require("../services/qr.service");

/**
 * Get public QR profile (no auth required)
 * Returns pet info with masked PII
 */
async function getQRProfile(req, res) {
  try {
    const { petId } = req.params;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    const profile = await getPublicPetProfile(petId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching QR profile:", error);

    if (error.message === "Pet not found") {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error fetching pet profile",
      code: 500,
    });
  }
}

/**
 * Log QR scan
 * Captures scan data including optional geolocation
 */
async function logScan(req, res) {
  try {
    const { petId } = req.params;
    const { geolocation, notes, isLost, scannedBy, deviceInfo } = req.body;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    // Validate geolocation if provided
    if (geolocation) {
      const geoSchema = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().min(0).optional(),
        timestamp: z.string().datetime().optional(),
      });

      const geoResult = geoSchema.safeParse(geolocation);
      if (!geoResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid geolocation data",
          code: 400,
        });
      }
    }

    const clientIp = req.ip || req.connection.remoteAddress || "";

    const qrScan = await logQRScan(petId, {
      ipAddress: clientIp,
      userAgent: req.headers["user-agent"] || "",
      geolocation: geolocation ? {
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
        accuracy: geolocation.accuracy,
        timestamp: geolocation.timestamp ? new Date(geolocation.timestamp) : new Date(),
      } : null,
      deviceInfo: deviceInfo || "",
      isLost: Boolean(isLost),
      scannedBy: scannedBy || "",
      notes: notes || "",
    });

    return res.status(200).json({
      success: true,
      message: "Scan logged successfully",
      data: {
        scanId: qrScan._id,
      },
    });
  } catch (error) {
    console.error("Error logging QR scan:", error);

    if (error.message === "Pet not found") {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error logging scan",
      code: 500,
    });
  }
}

/**
 * Download QR code as PNG file
 */
async function downloadQRCode(req, res) {
  try {
    const { petId } = req.params;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    const qrBuffer = await generateQRCodeBuffer(petId);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${pet.name}-QR-${petId}.png"`);

    return res.send(qrBuffer);
  } catch (error) {
    console.error("Error downloading QR code:", error);

    return res.status(500).json({
      success: false,
      message: "Error generating QR code",
      code: 500,
    });
  }
}

/**
 * Get QR scan history (admin/vet only)
 */
async function getScanHistory(req, res) {
  try {
    const { petId } = req.params;
    const { page = 1, limit = 20, isLost = null } = req.query;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    const history = await getQRScanHistory(petId, {
      page: Number(page),
      limit: Number(limit),
      isLost: isLost === "true" ? true : isLost === "false" ? false : null,
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching scan history:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching scan history",
      code: 500,
    });
  }
}

/**
 * Report pet as lost
 */
async function reportLost(req, res) {
  try {
    const { petId } = req.params;
    const reportData = req.body;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    // Validate report data
    const reportSchema = z.object({
      lastSeenAddress: z.string().max(200).optional(),
      lastSeenDate: z.string().datetime().optional(),
      lastSeenCoordinates: z
        .object({
          longitude: z.number().min(-180).max(180),
          latitude: z.number().min(-90).max(90),
        })
        .optional(),
      description: z.string().max(1000).optional(),
      photos: z.array(z.string().url()).max(5).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      rewardAmount: z.number().min(0).optional(),
      currency: z.enum(["USD", "EUR", "GBP", "CAD"]).optional(),
    });

    const parsed = reportSchema.safeParse(reportData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    // Check if adopter owns the pet or is admin
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    // Only owner or admin can report lost
    if (
      req.authUser._id.toString() !== pet.addedBy.toString() &&
      req.authUser.role !== "admin" &&
      req.authUser.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to report this pet as lost",
        code: 403,
      });
    }

    const lostReport = await createLostPetReport(
      petId,
      req.authUser._id,
      {
        ...parsed.data,
        lastSeenCoordinates: parsed.data.lastSeenCoordinates
          ? [parsed.data.lastSeenCoordinates.longitude, parsed.data.lastSeenCoordinates.latitude]
          : null,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Lost pet report created successfully",
      data: {
        lostReport: {
          id: lostReport._id,
          status: lostReport.status,
          petId: lostReport.pet,
        },
      },
    });
  } catch (error) {
    console.error("Error reporting pet as lost:", error);

    if (error.message.includes("already has an active lost report")) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 409,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating lost report",
      code: 500,
    });
  }
}

/**
 * Mark lost pet as found
 */
async function markFound(req, res) {
  try {
    const { petId } = req.params;
    const { foundAddress, foundCoordinates, finderContact } = req.body;

    // Validate coordinates if provided
    if (foundCoordinates) {
      const coordSchema = z.object({
        longitude: z.number().min(-180).max(180),
        latitude: z.number().min(-90).max(90),
      });

      const coordResult = coordSchema.safeParse(foundCoordinates);
      if (!coordResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates",
          code: 400,
        });
      }
    }

    // Find lost pet report
    const lostPet = await LostPet.findOne({
      pet: petId,
      status: "lost",
      isActive: true,
    });

    if (!lostPet) {
      return res.status(404).json({
        success: false,
        message: "No active lost report found for this pet",
        code: 404,
      });
    }

    const updated = await markPetAsFound(lostPet._id, req.authUser._id, {
      foundAddress: foundAddress || "",
      foundCoordinates: foundCoordinates
        ? [foundCoordinates.longitude, foundCoordinates.latitude]
        : null,
      finderContact: finderContact || "",
    });

    return res.status(200).json({
      success: true,
      message: "Pet marked as found successfully",
      data: {
        lostReport: {
          id: updated._id,
          status: updated.status,
        },
      },
    });
  } catch (error) {
    console.error("Error marking pet as found:", error);

    return res.status(500).json({
      success: false,
      message: "Error marking pet as found",
      code: 500,
    });
  }
}

/**
 * Get nearby lost/found pets
 */
async function getNearby(req, res) {
  try {
    const { longitude, latitude, radius = 50000 } = req.query;

    // Validate coordinates
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
        code: 400,
      });
    }

    const coordSchema = z.object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
      radius: z.number().min(100).max(500000),
    });

    const parsed = coordSchema.safeParse({
      longitude: Number(longitude),
      latitude: Number(latitude),
      radius: Number(radius),
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const nearbyPets = await getNearbyLostPets(
      [parsed.data.longitude, parsed.data.latitude],
      parsed.data.radius
    );

    return res.status(200).json({
      success: true,
      data: {
        pets: nearbyPets,
        count: nearbyPets.length,
      },
    });
  } catch (error) {
    console.error("Error getting nearby lost pets:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching nearby pets",
      code: 500,
    });
  }
}

/**
 * Regenerate QR code for a pet (admin/vet only)
 */
async function regenerateQRCode(req, res) {
  try {
    const { petId } = req.params;

    // Validate pet ID format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
        code: 400,
      });
    }

    const qrCodeUrl = await ensureQRCodeExists(petId);

    return res.status(200).json({
      success: true,
      message: "QR code regenerated successfully",
      data: {
        qrCodeUrl,
      },
    });
  } catch (error) {
    console.error("Error regenerating QR code:", error);

    if (error.message === "Pet not found") {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error regenerating QR code",
      code: 500,
    });
  }
}

module.exports = {
  getQRProfile,
  logScan,
  downloadQRCode,
  getScanHistory,
  reportLost,
  markFound,
  getNearby,
  regenerateQRCode,
};
