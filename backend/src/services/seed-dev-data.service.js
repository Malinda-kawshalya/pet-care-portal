const mongoose = require("mongoose");
const User = require("../models/User");
const Pet = require("../models/Pet");
const Application = require("../models/Application");
const CareGuide = require("../models/CareGuide");
const HealthEvent = require("../models/HealthEvent");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const CommunityMessage = require("../models/CommunityMessage");
const QRScan = require("../models/QRScan");
const LostPet = require("../models/LostPet");
const ShopProduct = require("../models/ShopProduct");
const { USER_ROLES } = require("../constants/roles");
const { hashPassword } = require("../utils/password");
const { generateQRCode } = require("../utils/qr");

const USERS = [
  {
    key: "admin",
    fullName: "Platform Admin",
    email: "admin@petcare.local",
    password: "AdminPass@123",
    role: USER_ROLES.ADMIN,
    phone: "+10000000000",
    profilePhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "vet",
    fullName: "Dr. Sophia Reed",
    email: "vet.sophia@petcare.local",
    password: "VetPass@123",
    role: USER_ROLES.VET,
    phone: "+10000000001",
    profilePhoto:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "maya",
    fullName: "Maya Thompson",
    email: "maya.thompson@petcare.local",
    password: "AdopterPass@123",
    role: USER_ROLES.ADOPTER,
    phone: "+10000000002",
    profilePhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "liam",
    fullName: "Liam Carter",
    email: "liam.carter@petcare.local",
    password: "AdopterPass@123",
    role: USER_ROLES.ADOPTER,
    phone: "+10000000003",
    profilePhoto:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "zoe",
    fullName: "Zoe Patel",
    email: "zoe.patel@petcare.local",
    password: "AdopterPass@123",
    role: USER_ROLES.ADOPTER,
    phone: "+10000000004",
    profilePhoto:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "noah",
    fullName: "Noah Williams",
    email: "noah.williams@petcare.local",
    password: "AdopterPass@123",
    role: USER_ROLES.ADOPTER,
    phone: "+10000000005",
    profilePhoto:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?q=80&w=1200&auto=format&fit=crop",
  },
];

const PETS = [
  {
    key: "milo",
    name: "Milo",
    species: "cat",
    breed: "Tabby",
    age: 36,
    gender: "male",
    weight: 4.3,
    colour: "Orange",
    description: "Curious, calm, and very affectionate.",
    photos: [
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy and ready for adoption.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "luna",
    name: "Luna",
    species: "dog",
    breed: "Golden Retriever",
    age: 42,
    gender: "female",
    weight: 24.1,
    colour: "Golden",
    description: "Friendly and playful with a gentle nature.",
    photos: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Vaccinated and neutered.",
    isVaccinated: true,
    status: "adopted",
  },
  {
    key: "charlie",
    name: "Charlie",
    species: "dog",
    breed: "Beagle",
    age: 12,
    gender: "male",
    weight: 10.2,
    colour: "Tan",
    description: "Energetic puppy who loves people and walks.",
    photos: [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy, vaccination schedule up to date.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "bella",
    name: "Bella",
    species: "bird",
    breed: "Parrot",
    age: 18,
    gender: "female",
    weight: 0.9,
    colour: "Red",
    description: "Vocal bird with lots of personality.",
    photos: [
      "https://images.unsplash.com/photo-1501706362039-c6e13b4f69d6?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy with recent check-up.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "daisy",
    name: "Daisy",
    species: "dog",
    breed: "Samoyed",
    age: 24,
    gender: "female",
    weight: 19.7,
    colour: "White",
    description: "Affectionate and enjoys cuddles and playtime.",
    photos: [
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Vaccinated and healthy.",
    isVaccinated: true,
    status: "reserved",
  },
  {
    key: "simba",
    name: "Simba",
    species: "cat",
    breed: "Maine Coon",
    age: 48,
    gender: "male",
    weight: 6.8,
    colour: "Black and white",
    description: "Calm indoor cat with a gentle temperament.",
    photos: [
      "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy and vaccinated.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "coco",
    name: "Coco",
    species: "dog",
    breed: "Labrador Retriever",
    age: 14,
    gender: "female",
    weight: 11.5,
    colour: "Brown",
    description: "Active puppy that loves running and learning tricks.",
    photos: [
      "https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Vaccinated and gaining weight normally.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "oreo",
    name: "Oreo",
    species: "rabbit",
    breed: "Guinea Pig",
    age: 10,
    gender: "male",
    weight: 0.8,
    colour: "Black and white",
    description: "Quiet companion that enjoys a peaceful home.",
    photos: [
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy and ready for adoption.",
    isVaccinated: true,
    status: "available",
  },
  {
    key: "poppy",
    name: "Poppy",
    species: "cat",
    breed: "Domestic Shorthair",
    age: 20,
    gender: "female",
    weight: 3.9,
    colour: "Cream and white",
    description: "Cuddly indoor cat that enjoys quiet company.",
    photos: [
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1000&auto=format&fit=crop",
    ],
    healthStatus: "Healthy, spayed, and microchipped.",
    isVaccinated: true,
    status: "available",
  },
];

const APPLICATIONS = [
  {
    key: "maya-luna",
    applicant: "maya",
    pet: "luna",
    status: "adopted",
    homeType: "house",
    hasOutdoorSpace: true,
    otherPets: "One senior cat named Pebble",
    workSchedule: "Remote work three days per week",
    priorExperience: "Raised two dogs and one cat over the past 10 years.",
    reasonForAdoption: "Looking for an active companion for hiking and daily routines.",
    statusHistory: [
      { status: "received", changedBy: "maya", changedAt: daysAgo(15) },
      { status: "under_review", changedBy: "admin", changedAt: daysAgo(13) },
      { status: "interview_scheduled", changedBy: "admin", changedAt: daysAgo(11) },
      { status: "reserved", changedBy: "admin", changedAt: daysAgo(9) },
      { status: "adopted", changedBy: "admin", changedAt: daysAgo(7) },
    ],
    adminNotes: [
      {
        note: "Excellent home setup and clear experience with energetic dogs.",
        author: "admin",
        date: daysAgo(13),
      },
    ],
  },
  {
    key: "liam-daisy",
    applicant: "liam",
    pet: "daisy",
    status: "reserved",
    homeType: "apartment",
    hasOutdoorSpace: false,
    otherPets: "None",
    workSchedule: "Hybrid schedule, home four days a week",
    priorExperience: "First-time adopter, completed shelter orientation.",
    reasonForAdoption: "Want a calm, affectionate dog for companionship.",
    statusHistory: [
      { status: "received", changedBy: "liam", changedAt: daysAgo(10) },
      { status: "under_review", changedBy: "admin", changedAt: daysAgo(8) },
      { status: "reserved", changedBy: "admin", changedAt: daysAgo(6) },
    ],
    adminNotes: [
      {
        note: "Good applicant. Suggested follow-up on apartment exercise plan.",
        author: "admin",
        date: daysAgo(8),
      },
    ],
  },
  {
    key: "zoe-charlie",
    applicant: "zoe",
    pet: "charlie",
    status: "received",
    homeType: "house",
    hasOutdoorSpace: true,
    otherPets: "Two rabbits",
    workSchedule: "Office three days a week",
    priorExperience: "Volunteered at a shelter for one year.",
    reasonForAdoption: "Looking for a playful dog to join the family.",
    statusHistory: [{ status: "received", changedBy: "zoe", changedAt: daysAgo(4) }],
    adminNotes: [],
  },
  {
    key: "noah-simba",
    applicant: "noah",
    pet: "simba",
    status: "rejected",
    homeType: "other",
    hasOutdoorSpace: false,
    otherPets: "One adult cat",
    workSchedule: "Rotating shifts",
    priorExperience: "Has owned cats for five years.",
    reasonForAdoption: "Looking for a calm indoor companion.",
    statusHistory: [
      { status: "received", changedBy: "noah", changedAt: daysAgo(12) },
      { status: "under_review", changedBy: "admin", changedAt: daysAgo(9) },
      { status: "rejected", changedBy: "admin", changedAt: daysAgo(5) },
    ],
    adminNotes: [
      {
        note: "Application was declined due to recent housing instability.",
        author: "admin",
        date: daysAgo(5),
      },
    ],
  },
];

const CARE_GUIDES = [
  {
    key: "luna-guide",
    pet: "luna",
    adopter: "maya",
    version: 1,
    vetVerified: true,
    verifiedBy: "vet",
    content: `# Luna Care Guide\n\n> AI-generated guide. Reviewed by a veterinarian.\n\n## Feeding\n- 2 meals per day\n- High-protein dog food for active breeds\n- Fresh water available at all times\n\n## Exercise\n- 60-90 minutes of walking and play daily\n- Weekly hiking or fetch sessions\n\n## Grooming\n- Brush 2-3 times per week\n- Bath every 6-8 weeks or as needed\n\n## Health\n- Vet checkup every 6 months\n- Maintain flea, tick, and heartworm prevention\n\n## Behavior\n- Reward calm behavior\n- Keep training sessions short and consistent\n`,
  },
];

const HEALTH_EVENTS = [
  {
    key: "luna-booster",
    pet: "luna",
    adopter: "maya",
    eventType: "vaccination_booster",
    title: "Rabies and DHPP booster",
    description: "Booster due for Luna after adoption follow-up.",
    scheduledDate: daysFromNow(7),
    veterinarian: {
      name: "Dr. Sophia Reed",
      clinic: "Downtown Animal Care",
      phone: "+10000000001",
    },
    cost: 48,
    notes: "Bring vaccination records and microchip details.",
    isCompleted: false,
    colorCode: "amber",
  },
  {
    key: "luna-checkup",
    pet: "luna",
    adopter: "maya",
    eventType: "checkup",
    title: "Post-adoption wellness check",
    description: "Routine checkup to confirm Luna is settling in well.",
    scheduledDate: daysFromNow(14),
    veterinarian: {
      name: "Dr. Sophia Reed",
      clinic: "Downtown Animal Care",
      phone: "+10000000001",
    },
    cost: 65,
    notes: "Check weight, appetite, and stress signals.",
    isCompleted: false,
    colorCode: "blue",
  },
  {
    key: "daisy-flea",
    pet: "daisy",
    adopter: "liam",
    eventType: "flea_treatment",
    title: "Monthly flea and tick treatment",
    description: "Preventive treatment before the next outdoor walk season.",
    scheduledDate: daysFromNow(10),
    veterinarian: {
      name: "Dr. Sophia Reed",
      clinic: "Downtown Animal Care",
      phone: "+10000000001",
    },
    cost: 30,
    notes: "Use the shelter-approved topical treatment.",
    isCompleted: false,
    colorCode: "green",
  },
  {
    key: "simba-dental",
    pet: "simba",
    adopter: "noah",
    eventType: "dental_cleaning",
    title: "Dental cleaning appointment",
    description: "Recommended dental cleaning for Simba.",
    scheduledDate: daysFromNow(30),
    veterinarian: {
      name: "Dr. Sophia Reed",
      clinic: "Downtown Animal Care",
      phone: "+10000000001",
    },
    cost: 110,
    notes: "Discuss tartar prevention during visit.",
    isCompleted: false,
    colorCode: "purple",
  },
];

const NOTIFICATIONS = [
  {
    key: "maya-application",
    recipient: "maya",
    type: "applicationStatus",
    title: "Luna adoption approved",
    message: "Your application for Luna has been approved and marked as adopted.",
    link: "/dashboard",
    readAt: daysAgo(6),
    metadata: { petKey: "luna", applicationKey: "maya-luna" },
    channels: { inApp: true, email: true },
  },
  {
    key: "maya-health",
    recipient: "maya",
    type: "healthReminder",
    title: "Upcoming booster reminder",
    message: "Luna has a booster appointment scheduled in 7 days.",
    link: "/health/placeholder",
    metadata: { petKey: "luna", eventKey: "luna-booster" },
    channels: { inApp: true, email: true },
  },
  {
    key: "liam-reserved",
    recipient: "liam",
    type: "applicationStatus",
    title: "Daisy reserved",
    message: "Daisy has been reserved while your application is under review.",
    link: "/dashboard",
    metadata: { petKey: "daisy", applicationKey: "liam-daisy" },
    channels: { inApp: true, email: false },
  },
  {
    key: "noah-rejected",
    recipient: "noah",
    type: "applicationStatus",
    title: "Simba application update",
    message: "Your application needs revision before the next review round.",
    link: "/dashboard",
    metadata: { petKey: "simba", applicationKey: "noah-simba" },
    channels: { inApp: true, email: false },
  },
  {
    key: "admin-system",
    recipient: "admin",
    type: "system",
    title: "Seed data ready",
    message: "The development database has been populated with a full demo dataset.",
    link: "/admin",
    metadata: { source: "seed-dev-data" },
    channels: { inApp: true, email: false },
  },
];

const POSTS = [
  {
    key: "maya-luna-post",
    author: "maya",
    title: "Luna's first week at home",
    content:
      "Luna has already claimed the sunny spot by the window. The adoption process was smooth, and the care guide has been incredibly helpful for the first few days.",
    category: "success-stories",
    tags: ["adoption", "golden-retriever", "success-story"],
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop",
    ],
    likes: ["liam", "zoe", "admin"],
    shareCount: 4,
    viewCount: 128,
    isFeatured: true,
    isPinned: false,
  },
  {
    key: "admin-tips-post",
    author: "admin",
    title: "Five things to prepare before adoption day",
    content:
      "Plan for food, water bowls, a quiet room, a leash or carrier, and a vet appointment. A prepared home makes the transition easier for every pet.",
    category: "tips",
    tags: ["adoption", "preparation", "tips"],
    images: [
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1000&auto=format&fit=crop",
    ],
    likes: ["maya", "liam", "zoe", "noah"],
    shareCount: 11,
    viewCount: 240,
    isFeatured: true,
    isPinned: true,
  },
  {
    key: "liam-question-post",
    author: "liam",
    title: "Best crate size for a medium dog?",
    content:
      "I am helping a friend prepare for a medium-size dog adoption. What crate size do you recommend for a calm adult dog?",
    category: "questions",
    tags: ["crate", "advice", "questions"],
    images: [],
    likes: ["admin"],
    shareCount: 2,
    viewCount: 74,
    isFeatured: false,
    isPinned: false,
  },
  {
    key: "zoe-lost-found-post",
    author: "zoe",
    title: "Found a friendly cat near the park",
    content:
      "A grey cat with a blue collar was found near the park entrance. I scanned the QR tag and notified the owner. Sharing here in case anyone else is missing a cat nearby.",
    category: "lost-found",
    tags: ["lost-found", "qr", "community"],
    images: [
      "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=1000&auto=format&fit=crop",
    ],
    likes: ["maya"],
    shareCount: 7,
    viewCount: 101,
    isFeatured: false,
    isPinned: false,
  },
];

const COMMENTS = [
  {
    key: "comment-1",
    post: "maya-luna-post",
    author: "liam",
    content: "Luna looks so relaxed already. Great job on the transition.",
    parentComment: null,
    likes: ["maya", "admin"],
  },
  {
    key: "comment-2",
    post: "maya-luna-post",
    author: "admin",
    content: "Thanks for sharing. This is a perfect example of a smooth first week.",
    parentComment: "comment-1",
    likes: ["maya"],
  },
  {
    key: "comment-3",
    post: "admin-tips-post",
    author: "maya",
    content: "The quiet room advice is especially helpful for first-time adopters.",
    parentComment: null,
    likes: ["admin", "liam"],
  },
  {
    key: "comment-4",
    post: "liam-question-post",
    author: "admin",
    content: "For a medium adult dog, start with a crate around 30 inches and adjust to the pet's size.",
    parentComment: null,
    likes: ["liam"],
  },
];

const COMMUNITY_MESSAGES = [
  { author: "maya", content: "Has anyone used the new health timeline? It helped me track Luna's vaccinations." },
  { author: "vet", content: "Yes, and please keep medical notes updated so your vet can review them quickly." },
  { author: "liam", content: "The QR profile is working well after a scan at the shelter gate." },
];

const QR_SCANS = [
  {
    key: "luna-scan-1",
    pet: "luna",
    petName: "Luna",
    scannedBy: "Downtown Animal Care",
    ipAddress: "192.168.1.24",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    geolocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 18,
      timestamp: daysAgo(3),
    },
    deviceInfo: "iPhone Safari",
    isLost: true,
    notes: "QR scan triggered a lost-pet alert during a park walk.",
    scannedAt: daysAgo(3),
  },
  {
    key: "milo-scan-1",
    pet: "milo",
    petName: "Milo",
    scannedBy: "Shelter volunteer",
    ipAddress: "10.0.0.12",
    userAgent: "Mozilla/5.0 (Android 14)",
    geolocation: {
      latitude: 40.7153,
      longitude: -74.002,
      accuracy: 24,
      timestamp: daysAgo(8),
    },
    deviceInfo: "Android Chrome",
    isLost: false,
    notes: "Routine scan during community event.",
    scannedAt: daysAgo(8),
  },
  {
    key: "charlie-scan-1",
    pet: "charlie",
    petName: "Charlie",
    scannedBy: "Anonymous finder",
    ipAddress: "203.0.113.12",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    geolocation: {
      latitude: 40.7182,
      longitude: -74.0121,
      accuracy: 30,
      timestamp: daysAgo(1),
    },
    deviceInfo: "Desktop browser",
    isLost: true,
    notes: "Potential lost pet in neighborhood.",
    scannedAt: daysAgo(1),
  },
];

const LOST_PETS = [
  {
    key: "luna-lost",
    pet: "luna",
    adoption: "maya-luna",
    owner: "maya",
    status: "returned",
    reportedDate: daysAgo(6),
    lastSeenLocation: {
      address: "Riverside Park, New York, NY",
      coordinates: { type: "Point", coordinates: [-74.006, 40.7128] },
    },
    lastSeenDate: daysAgo(6),
    description: "Luna slipped her harness during a park walk but was quickly located.",
    photos: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop",
    ],
    contactInfo: {
      phone: "+10000000002",
      email: "maya.thompson@petcare.local",
    },
    reward: { amount: 0, currency: "USD" },
    foundDate: daysAgo(5),
    foundLocation: {
      address: "Downtown Animal Care",
      coordinates: { type: "Point", coordinates: [-74.002, 40.714] },
    },
    foundBy: "vet",
    isActive: false,
  },
  {
    key: "charlie-lost",
    pet: "charlie",
    adoption: "zoe-charlie",
    owner: "zoe",
    status: "lost",
    reportedDate: daysAgo(2),
    lastSeenLocation: {
      address: "Brooklyn Greenway Trail",
      coordinates: { type: "Point", coordinates: [-73.995, 40.719] },
    },
    lastSeenDate: daysAgo(2),
    description: "Charlie was seen near the trail and has a bright yellow collar.",
    photos: [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1000&auto=format&fit=crop",
    ],
    contactInfo: {
      phone: "+10000000004",
      email: "zoe.patel@petcare.local",
    },
    reward: { amount: 150, currency: "USD" },
    foundDate: null,
    foundLocation: null,
    foundBy: null,
    isActive: true,
  },
];

const SHOP_PRODUCTS = [
  {
    name: "Ceylon Blend Puppy Kibble 2kg",
    description:
      "Nutrient-rich dry food for puppies with rice, fish protein, and added calcium for healthy growth.",
    price: 4200,
    stock: 22,
    category: "Food",
    imageUrl:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop",
    owner: "vet",
  },
  {
    name: "Herbal Tick & Flea Spray 250ml",
    description:
      "Plant-based coat spray for tropical climates. Helps repel ticks and fleas safely for cats and dogs.",
    price: 1850,
    stock: 34,
    category: "Health",
    imageUrl:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop",
    owner: "vet",
  },
  {
    name: "Cooling Pet Mat",
    description:
      "Pressure-activated cooling mat that helps pets stay comfortable during warm Sri Lankan afternoons.",
    price: 5600,
    stock: 15,
    category: "Comfort",
    imageUrl:
      "https://images.unsplash.com/photo-1583512603806-077998240c7a?q=80&w=1000&auto=format&fit=crop",
    owner: "admin",
  },
  {
    name: "Reflective Collar with Name Tag",
    description:
      "Durable adjustable collar with reflective stitching and engraved name tag support for nighttime safety.",
    price: 1450,
    stock: 48,
    category: "Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1560743641-3914f2c45636?q=80&w=1000&auto=format&fit=crop",
    owner: "admin",
  },
  {
    name: "Vet-Approved Grooming Kit",
    description:
      "All-in-one grooming set including brush, comb, claw clipper, and gentle shampoo for weekly care.",
    price: 7200,
    stock: 10,
    category: "Grooming",
    imageUrl:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1000&auto=format&fit=crop",
    owner: "vet",
  },
  {
    name: "Ceramic No-Spill Feeding Bowl",
    description:
      "Weighted ceramic bowl with anti-slip base, ideal for energetic pets and easy daily cleaning.",
    price: 2300,
    stock: 27,
    category: "Feeding",
    imageUrl:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1000&auto=format&fit=crop",
    owner: "admin",
  },
];

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function resetCollections() {
  const collections = [
    Comment,
    Post,
    Notification,
    QRScan,
    LostPet,
    ShopProduct,
    HealthEvent,
    CareGuide,
    Application,
    Pet,
    User,
  ];

  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

function buildStatusHistory(entries, userMap) {
  return entries.map((entry) => ({
    status: entry.status,
    changedAt: entry.changedAt,
    changedBy: userMap[entry.changedBy]._id,
  }));
}

function buildAdminNotes(entries, userMap) {
  return entries.map((entry) => ({
    note: entry.note,
    author: userMap[entry.author]._id,
    date: entry.date,
  }));
}

async function seedDevelopmentData({ reset = true } = {}) {
  if (reset) {
    await resetCollections();
  }

  const userMap = {};
  for (const userSeed of USERS) {
    const user = await User.findOneAndUpdate(
      { email: userSeed.email },
      {
        $set: {
          fullName: userSeed.fullName,
          email: userSeed.email,
          passwordHash: await hashPassword(userSeed.password),
          role: userSeed.role,
          phone: userSeed.phone,
          profilePhoto: userSeed.profilePhoto,
          isActive: true,
          tokenVersion: 0,
          lastActiveAt: new Date(),
        },
      },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
    );

    userMap[userSeed.key] = user;
  }

  const petMap = {};
  for (const petSeed of PETS) {
    const pet = await Pet.findOneAndUpdate(
      { name: petSeed.name },
      {
        $set: {
          name: petSeed.name,
          species: petSeed.species,
          breed: petSeed.breed,
          age: petSeed.age,
          gender: petSeed.gender,
          weight: petSeed.weight,
          colour: petSeed.colour,
          description: petSeed.description,
          photos: petSeed.photos,
          healthStatus: petSeed.healthStatus,
          isVaccinated: petSeed.isVaccinated,
          status: petSeed.status,
          addedBy: userMap.admin._id,
        },
      },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
    );

    const qrCodeUrl = await generateQRCode(pet._id.toString());
    pet.qrCodeUrl = qrCodeUrl;
    await pet.save();
    petMap[petSeed.key] = pet;
  }

  const applicationMap = {};
  for (const applicationSeed of APPLICATIONS) {
    const application = await Application.findOneAndUpdate(
      {
        pet: petMap[applicationSeed.pet]._id,
        applicant: userMap[applicationSeed.applicant]._id,
      },
      {
        $set: {
          pet: petMap[applicationSeed.pet]._id,
          applicant: userMap[applicationSeed.applicant]._id,
          status: applicationSeed.status,
          homeType: applicationSeed.homeType,
          hasOutdoorSpace: applicationSeed.hasOutdoorSpace,
          otherPets: applicationSeed.otherPets,
          workSchedule: applicationSeed.workSchedule,
          priorExperience: applicationSeed.priorExperience,
          reasonForAdoption: applicationSeed.reasonForAdoption,
          agreedToTerms: true,
          adminNotes: buildAdminNotes(applicationSeed.adminNotes, userMap),
          statusHistory: buildStatusHistory(applicationSeed.statusHistory, userMap),
        },
      },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
    );

    applicationMap[applicationSeed.key] = application;
  }

  await Pet.updateOne({ _id: petMap.luna._id }, { $set: { status: "adopted" } });
  await Pet.updateOne({ _id: petMap.daisy._id }, { $set: { status: "reserved" } });

  for (const guideSeed of CARE_GUIDES) {
    await CareGuide.findOneAndUpdate(
      {
        pet: petMap[guideSeed.pet]._id,
        adopter: userMap[guideSeed.adopter]._id,
      },
      {
        $set: {
          pet: petMap[guideSeed.pet]._id,
          adopter: userMap[guideSeed.adopter]._id,
          content: guideSeed.content,
          vetVerified: guideSeed.vetVerified,
          verifiedBy: guideSeed.verifiedBy ? userMap[guideSeed.verifiedBy]._id : null,
          verifiedAt: guideSeed.vetVerified ? daysAgo(5) : null,
          version: guideSeed.version,
          archived: false,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  for (const healthEventSeed of HEALTH_EVENTS) {
    await HealthEvent.findOneAndUpdate(
      {
        pet: petMap[healthEventSeed.pet]._id,
        adopter: userMap[healthEventSeed.adopter]._id,
        title: healthEventSeed.title,
      },
      {
        $set: {
          pet: petMap[healthEventSeed.pet]._id,
          adopter: userMap[healthEventSeed.adopter]._id,
          eventType: healthEventSeed.eventType,
          title: healthEventSeed.title,
          description: healthEventSeed.description,
          scheduledDate: healthEventSeed.scheduledDate,
          veterinarian: healthEventSeed.veterinarian,
          cost: healthEventSeed.cost,
          notes: healthEventSeed.notes,
          isCompleted: healthEventSeed.isCompleted,
          createdBy: userMap.admin._id,
          completedDate: null,
          reminderSentAt: null,
          colorCode: healthEventSeed.colorCode,
          attachments: [],
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  for (const notificationSeed of NOTIFICATIONS) {
    await Notification.findOneAndUpdate(
      {
        recipient: userMap[notificationSeed.recipient]._id,
        type: notificationSeed.type,
        title: notificationSeed.title,
      },
      {
        $set: {
          recipient: userMap[notificationSeed.recipient]._id,
          type: notificationSeed.type,
          title: notificationSeed.title,
          message: notificationSeed.message,
          link: notificationSeed.link,
          readAt: notificationSeed.readAt || null,
          metadata: notificationSeed.metadata,
          channels: notificationSeed.channels,
          emailSentAt: null,
          emailError: "",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const postMap = {};
  for (const postSeed of POSTS) {
    const post = await Post.findOneAndUpdate(
      { title: postSeed.title },
      {
        $set: {
          author: userMap[postSeed.author]._id,
          title: postSeed.title,
          content: postSeed.content,
          category: postSeed.category,
          tags: postSeed.tags,
          images: postSeed.images,
          likes: postSeed.likes.map((key) => userMap[key]._id),
          likeCount: postSeed.likes.length,
          commentCount: 0,
          shareCount: postSeed.shareCount,
          viewCount: postSeed.viewCount,
          reports: [],
          reportCount: 0,
          isModerated: false,
          isFeatured: postSeed.isFeatured,
          isLocked: false,
          isPinned: postSeed.isPinned,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    postMap[postSeed.key] = post;
  }

  for (const commentSeed of COMMENTS) {
    await Comment.findOneAndUpdate(
      {
        post: postMap[commentSeed.post]._id,
        author: userMap[commentSeed.author]._id,
        content: commentSeed.content,
      },
      {
        $set: {
          post: postMap[commentSeed.post]._id,
          author: userMap[commentSeed.author]._id,
          content: commentSeed.content,
          parentComment: commentSeed.parentComment ? null : null,
          replyCount: 0,
          likes: commentSeed.likes.map((key) => userMap[key]._id),
          likeCount: commentSeed.likes.length,
          reports: [],
          reportCount: 0,
          isModerated: false,
          isEdited: false,
          editedAt: null,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  for (const messageSeed of COMMUNITY_MESSAGES) {
    await CommunityMessage.findOneAndUpdate(
      {
        room: "main",
        author: userMap[messageSeed.author]._id,
        content: messageSeed.content,
      },
      {
        $set: {
          room: "main",
          author: userMap[messageSeed.author]._id,
          content: messageSeed.content,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const topLevelComment = await Comment.findOne({ content: COMMENTS[0].content });
  const replyComment = await Comment.findOne({ content: COMMENTS[1].content });
  if (topLevelComment && replyComment) {
    await Comment.updateOne(
      { _id: replyComment._id },
      { $set: { parentComment: topLevelComment._id } }
    );
    await Comment.updateOne(
      { _id: topLevelComment._id },
      { $set: { replyCount: 1 } }
    );
  }

  for (const scanSeed of QR_SCANS) {
    await QRScan.findOneAndUpdate(
      {
        pet: petMap[scanSeed.pet]._id,
        scannedAt: scanSeed.scannedAt,
        scannedBy: scanSeed.scannedBy,
      },
      {
        $set: {
          pet: petMap[scanSeed.pet]._id,
          petName: scanSeed.petName,
          scannedBy: scanSeed.scannedBy,
          ipAddress: scanSeed.ipAddress,
          userAgent: scanSeed.userAgent,
          geolocation: scanSeed.geolocation,
          deviceInfo: scanSeed.deviceInfo,
          isLost: scanSeed.isLost,
          notes: scanSeed.notes,
          scannedAt: scanSeed.scannedAt,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  for (const lostSeed of LOST_PETS) {
    await LostPet.findOneAndUpdate(
      {
        pet: petMap[lostSeed.pet]._id,
        owner: userMap[lostSeed.owner]._id,
      },
      {
        $set: {
          pet: petMap[lostSeed.pet]._id,
          adoption: applicationMap[lostSeed.adoption]._id,
          owner: userMap[lostSeed.owner]._id,
          status: lostSeed.status,
          reportedDate: lostSeed.reportedDate,
          lastSeenLocation: lostSeed.lastSeenLocation,
          lastSeenDate: lostSeed.lastSeenDate,
          description: lostSeed.description,
          photos: lostSeed.photos,
          contactInfo: lostSeed.contactInfo,
          reward: lostSeed.reward,
          foundDate: lostSeed.foundDate,
          foundLocation: lostSeed.foundLocation,
          foundBy: lostSeed.foundBy ? userMap[lostSeed.foundBy]._id : null,
          isActive: lostSeed.isActive,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  for (const productSeed of SHOP_PRODUCTS) {
    await ShopProduct.findOneAndUpdate(
      { name: productSeed.name },
      {
        $set: {
          name: productSeed.name,
          description: productSeed.description,
          price: productSeed.price,
          stock: productSeed.stock,
          category: productSeed.category,
          imageUrl: productSeed.imageUrl,
          isActive: true,
          owner: userMap[productSeed.owner]._id,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const counts = {
    users: await User.countDocuments(),
    pets: await Pet.countDocuments(),
    applications: await Application.countDocuments(),
    careGuides: await CareGuide.countDocuments(),
    healthEvents: await HealthEvent.countDocuments(),
    notifications: await Notification.countDocuments(),
    posts: await Post.countDocuments(),
    comments: await Comment.countDocuments(),
    qrScans: await QRScan.countDocuments(),
    lostPets: await LostPet.countDocuments(),
    shopProducts: await ShopProduct.countDocuments(),
  };

  console.log("Development seed completed");
  console.log(JSON.stringify(counts, null, 2));

  return {
    userMap,
    petMap,
    applicationMap,
    counts,
  };
}

module.exports = {
  seedDevelopmentData,
};
