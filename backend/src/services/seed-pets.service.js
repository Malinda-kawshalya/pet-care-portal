const Pet = require("../models/Pet");
const User = require("../models/User");

const SAMPLE_PETS = [
  {
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
    ],
    healthStatus: "Healthy and ready for adoption.",
    isVaccinated: true,
    status: "available",
  },
  {
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
    ],
    healthStatus: "Vaccinated and neutered.",
    isVaccinated: true,
    status: "available",
  },
  {
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
    status: "available",
  },
  {
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
];

async function seedSamplePets() {
  const count = await Pet.countDocuments();
  if (count > 0) {
    return;
  }

  const superAdmin = await User.findOne({ role: "super_admin" });
  if (!superAdmin) {
    return;
  }

  await Pet.insertMany(
    SAMPLE_PETS.map((pet) => ({
      ...pet,
      addedBy: superAdmin._id,
    }))
  );

  console.log("Seeded sample pets for development");
}

module.exports = {
  seedSamplePets,
};
