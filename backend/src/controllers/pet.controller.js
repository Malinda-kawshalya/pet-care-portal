const { z } = require("zod");
const Pet = require("../models/Pet");
const HealthEvent = require("../models/HealthEvent");
const { generateQRCode } = require("../utils/qr");
const { transformImageUrl, transformVideoUrl } = require("../services/cloudinary.service");

const petFieldsSchema = z.object({
  name: z.string().trim().min(1).max(50),
  species: z.enum(["dog", "cat", "rabbit", "bird", "other"]),
  breed: z.string().trim().min(1).max(80),
  age: z.coerce.number().int().min(0),
  gender: z.enum(["male", "female"]),
  weight: z.union([z.coerce.number().min(0), z.null()]).optional(),
  colour: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  photos: z.array(z.string().url()).max(10).optional().default([]),
  video: z.string().trim().optional().default(""),
  healthStatus: z.string().trim().max(500).optional().default(""),
  isVaccinated: z.coerce.boolean(),
  status: z
    .enum(["pending_approval", "available", "reserved", "adopted", "removed"])
    .optional(),
  qrCodeUrl: z.string().trim().optional().default(""),
});

const createPetSchema = petFieldsSchema;
const updatePetSchema = petFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required",
  }
);

function toPublicPet(pet) {
  return {
    id: pet._id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    weight: pet.weight,
    colour: pet.colour,
    description: pet.description,
    photos: (pet.photos || []).map((photo) =>
      transformImageUrl(photo, { width: 1200, height: 900, crop: "fill" })
    ),
    video: pet.video ? transformVideoUrl(pet.video) : "",
    healthStatus: pet.healthStatus,
    isVaccinated: pet.isVaccinated,
    status: pet.status,
    listingType: pet.listingType,
    qrCodeUrl: pet.qrCodeUrl,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function listPets(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const sortBy = req.query.sortBy === "age" ? "age" : "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  const species = typeof req.query.species === "string" ? req.query.species.trim() : "";
  const breed = typeof req.query.breed === "string" ? req.query.breed.trim() : "";
  const gender = typeof req.query.gender === "string" ? req.query.gender.trim() : "";
  const minAge = req.query.minAge ? Number(req.query.minAge) : null;
  const maxAge = req.query.maxAge ? Number(req.query.maxAge) : null;

  const query = { status: "available", listingType: "adoption" };

  if (name) {
    query.name = { $regex: escapeRegex(name), $options: "i" };
  }

  if (species) {
    query.species = species;
  }

  if (breed) {
    query.breed = { $regex: escapeRegex(breed), $options: "i" };
  }

  if (gender) {
    query.gender = gender;
  }

  if (minAge !== null || maxAge !== null) {
    query.age = {};
    if (minAge !== null) {
      query.age.$gte = minAge;
    }
    if (maxAge !== null) {
      query.age.$lte = maxAge;
    }
  }

  const [totalCount, pets] = await Promise.all([
    Pet.countDocuments(query),
    Pet.find(query)
      .sort({ [sortBy]: sortOrder, createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      pets: pets.map(toPublicPet),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function getPetById(req, res) {
  const pet = await Pet.findById(req.params.id);

  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  const isAdmin =
    req.authUser && (req.authUser.role === "admin" || req.authUser.role === "super_admin");
  const isVet = req.authUser && req.authUser.role === "veterinarian";
  const isOwner = req.authUser && pet.addedBy.toString() === req.authUser._id.toString();
  const isPublicAdoptionPet = pet.status === "available" && pet.listingType === "adoption";
  const canView = isPublicAdoptionPet || isAdmin || isVet || isOwner;

  if (!canView) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      pet: toPublicPet(pet),
    },
  });
}

async function adminListPets(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const species = typeof req.query.species === "string" ? req.query.species.trim() : "";
  const query = {};

  if (status) {
    query.status = status;
  }

  if (species) {
    query.species = species;
  }

  const [totalCount, pets] = await Promise.all([
    Pet.countDocuments(query),
    Pet.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      pets: pets.map(toPublicPet),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function createPet(req, res) {
  const parsed = createPetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  let pet = await Pet.create({
    ...parsed.data,
    listingType: "adoption",
    addedBy: req.authUser._id,
  });

  // Generate QR code for the pet
  try {
    const qrCodeUrl = await generateQRCode(pet._id.toString());
    pet = await Pet.findByIdAndUpdate(pet._id, { qrCodeUrl }, { new: true });
  } catch (error) {
    console.warn("Warning: Failed to generate QR code for pet:", error);
    // Continue without QR code; it can be generated later
  }

  return res.status(201).json({
    success: true,
    message: "Pet created successfully",
    data: {
      pet: toPublicPet(pet),
    },
  });
}

async function submitPet(req, res) {
  const parsed = createPetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  let pet = await Pet.create({
    ...parsed.data,
    status: "pending_approval",
    listingType: "adoption",
    addedBy: req.authUser._id,
  });

  try {
    const qrCodeUrl = await generateQRCode(pet._id.toString());
    pet = await Pet.findByIdAndUpdate(pet._id, { qrCodeUrl }, { new: true });
  } catch (error) {
    console.warn("Warning: Failed to generate QR code for pet:", error);
  }

  return res.status(201).json({
    success: true,
    message: "Pet submitted successfully. It will appear after admin approval.",
    data: {
      pet: toPublicPet(pet),
    },
  });
}

async function listMyPetsWithHealth(req, res) {
  const pets = await Pet.find({
    addedBy: req.authUser._id,
    status: { $ne: "removed" },
  }).sort({ createdAt: -1 });

  const petIds = pets.map((pet) => pet._id);
  const events = await HealthEvent.find({ pet: { $in: petIds } })
    .sort({ scheduledDate: -1 })
    .populate({ path: "createdBy", select: "fullName role" });

  const eventsByPetId = events.reduce((accumulator, event) => {
    const key = event.pet.toString();
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push({
      id: event._id,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      scheduledDate: event.scheduledDate,
      completedDate: event.completedDate,
      isCompleted: event.isCompleted,
      veterinarian: event.veterinarian,
      notes: event.notes,
      createdBy: event.createdBy
        ? {
            id: event.createdBy._id,
            fullName: event.createdBy.fullName,
            role: event.createdBy.role,
          }
        : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });

    return accumulator;
  }, {});

  return res.status(200).json({
    success: true,
    data: {
      pets: pets.map((pet) => ({
        ...toPublicPet(pet),
        medicalRecords: eventsByPetId[pet._id.toString()] || [],
      })),
    },
  });
}

async function createProfilePet(req, res) {
  const parsed = createPetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  let pet = await Pet.create({
    ...parsed.data,
    status: "adopted",
    listingType: "profile",
    addedBy: req.authUser._id,
  });

  try {
    const qrCodeUrl = await generateQRCode(pet._id.toString());
    pet = await Pet.findByIdAndUpdate(pet._id, { qrCodeUrl }, { new: true });
  } catch (error) {
    console.warn("Warning: Failed to generate QR code for pet:", error);
  }

  return res.status(201).json({
    success: true,
    message: "Profile pet added successfully",
    data: {
      pet: toPublicPet(pet),
    },
  });
}

async function listPetsByOwner(req, res) {
  const ownerId = req.params.ownerId;
  const isPrivileged =
    req.authUser.role === "super_admin" || req.authUser.role === "veterinarian";

  if (!isPrivileged && req.authUser._id.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  const pets = await Pet.find({
    addedBy: ownerId,
    status: { $ne: "removed" },
  }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: {
      pets: pets.map(toPublicPet),
    },
  });
}

async function updatePet(req, res) {
  const parsed = updatePetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const pet = await Pet.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  });

  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Pet updated successfully",
    data: {
      pet: toPublicPet(pet),
    },
  });
}

async function deletePet(req, res) {
  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    { status: "removed" },
    { new: true }
  );

  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "Pet not found",
      code: 404,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Pet removed successfully",
    data: {
      pet: toPublicPet(pet),
    },
  });
}

module.exports = {
  listPets,
  getPetById,
  adminListPets,
  createPet,
  submitPet,
  listMyPetsWithHealth,
  createProfilePet,
  listPetsByOwner,
  updatePet,
  deletePet,
};
