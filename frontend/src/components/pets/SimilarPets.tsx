"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SimilarPet {
  id: string;
  name: string;
  breed: string;
  age: string;
  image: string;
  species: string;
}

interface SimilarPetsProps {
  currentSpecies: string;
  currentId: string;
}

export function SimilarPets({ currentSpecies, currentId }: SimilarPetsProps) {
  // Mock similar pets - in real app, fetch from API
  const similarPets: SimilarPet[] = [
    {
      id: "2",
      name: "Luna",
      breed: "Golden Retriever",
      age: "3 years",
      species: currentSpecies,
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Charlie",
      breed: "Beagle",
      age: "2 years",
      species: currentSpecies,
      image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "4",
      name: "Daisy",
      breed: "Samoyed",
      age: "4 years",
      species: currentSpecies,
      image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop",
    },
  ];

  return (
    <section className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Similar Pets</h3>
        <Link href="/pets" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
          View All <ArrowRight size={20} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {similarPets.map((pet) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="group overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="relative overflow-hidden h-40 bg-gray-200">
              <img
                src={pet.image}
                alt={pet.name}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900">{pet.name}</h4>
              <p className="text-sm text-gray-600">{pet.breed} • {pet.age}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                Learn More <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
