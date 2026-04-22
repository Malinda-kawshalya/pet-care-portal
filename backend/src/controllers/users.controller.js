const { z } = require("zod");
const User = require("../models/User");
const { USER_ROLES } = require("../constants/roles");

const listAdoptersQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const listVeterinariansQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: z.coerce.number().min(0.1).max(500).optional(),
});

const VET_DIRECTORY = [
  {
    clinicName: "Emerald City Animal Hospital",
    address: "456 Broadway E",
    city: "Seattle, WA",
    zipCode: "98102",
    rating: 4.5,
    lat: 47.6221,
    lng: -122.3212,
    openNow: true,
  },
  {
    clinicName: "Compassion Pet Care",
    address: "789 Queen Anne Ave N",
    city: "Seattle, WA",
    zipCode: "98109",
    rating: 4.9,
    lat: 47.6372,
    lng: -122.3574,
    openNow: false,
  },
  {
    clinicName: "Urban Vet Specialists",
    address: "321 Westlake Ave N",
    city: "Seattle, WA",
    zipCode: "98109",
    rating: 4.7,
    lat: 47.6213,
    lng: -122.3382,
    openNow: true,
  },
  {
    clinicName: "Puget Sound Veterinary Center",
    address: "1400 1st Ave",
    city: "Seattle, WA",
    zipCode: "98101",
    rating: 4.6,
    lat: 47.6088,
    lng: -122.3395,
    openNow: true,
  },
  {
    clinicName: "Lakeview Animal Clinic",
    address: "2400 Eastlake Ave E",
    city: "Seattle, WA",
    zipCode: "98102",
    rating: 4.8,
    lat: 47.6426,
    lng: -122.3251,
    openNow: false,
  },
  {
    clinicName: "Rainier Pet Emergency",
    address: "3800 Rainier Ave S",
    city: "Seattle, WA",
    zipCode: "98118",
    rating: 4.4,
    lat: 47.5719,
    lng: -122.2863,
    openNow: true,
  },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function haversineDistanceMiles(from, to) {
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;

  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;

  return distanceKm * 0.621371;
}

async function listAdopters(req, res) {
  const parsed = listAdoptersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const query = {
    role: USER_ROLES.ADOPTER,
    isActive: true,
  };

  if (parsed.data.q) {
    const safePattern = escapeRegex(parsed.data.q);
    query.$or = [
      { fullName: { $regex: safePattern, $options: "i" } },
      { email: { $regex: safePattern, $options: "i" } },
      { phone: { $regex: safePattern, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .sort({ fullName: 1 })
    .limit(parsed.data.limit)
    .select("_id fullName email phone role");

  return res.status(200).json({
    success: true,
    data: {
      users: users.map((user) => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      })),
    },
  });
}

async function listVeterinarians(req, res) {
  const parsed = listVeterinariansQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const query = {
    role: USER_ROLES.VETERINARIAN,
    isActive: true,
  };

  if (parsed.data.q) {
    const safePattern = escapeRegex(parsed.data.q);
    query.$or = [
      { fullName: { $regex: safePattern, $options: "i" } },
      { email: { $regex: safePattern, $options: "i" } },
      { phone: { $regex: safePattern, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .sort({ fullName: 1 })
    .limit(parsed.data.limit)
    .select("_id fullName email phone role profilePhoto");

  const vets = users.map((user, index) => {
    const directory = VET_DIRECTORY[index % VET_DIRECTORY.length];

    const vet = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto,
      clinicName: directory.clinicName,
      address: directory.address,
      city: directory.city,
      zipCode: directory.zipCode,
      rating: directory.rating,
      lat: directory.lat,
      lng: directory.lng,
      openNow: directory.openNow,
    };

    if (typeof parsed.data.lat === "number" && typeof parsed.data.lng === "number") {
      vet.distanceMiles = haversineDistanceMiles(
        { lat: parsed.data.lat, lng: parsed.data.lng },
        { lat: directory.lat, lng: directory.lng }
      );
    }

    return vet;
  });

  let filteredVets = vets;

  if (
    typeof parsed.data.lat === "number" &&
    typeof parsed.data.lng === "number" &&
    typeof parsed.data.radiusMiles === "number"
  ) {
    filteredVets = vets.filter((vet) => vet.distanceMiles <= parsed.data.radiusMiles);
  }

  filteredVets.sort((a, b) => {
    const aDistance = typeof a.distanceMiles === "number" ? a.distanceMiles : Number.MAX_SAFE_INTEGER;
    const bDistance = typeof b.distanceMiles === "number" ? b.distanceMiles : Number.MAX_SAFE_INTEGER;
    return aDistance - bDistance;
  });

  return res.status(200).json({
    success: true,
    data: {
      veterinarians: filteredVets,
    },
  });
}

module.exports = {
  listAdopters,
  listVeterinarians,
};
