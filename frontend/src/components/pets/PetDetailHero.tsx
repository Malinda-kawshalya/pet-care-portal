"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, MessageCircle, MapPin, Calendar, Weight } from "lucide-react";

interface PetDetailProps {
  pet: any;
}

export function PetDetailHero({ pet }: PetDetailProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const images = pet.photos && pet.photos.length > 0 
    ? pet.photos 
    : ["https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=1000&auto=format&fit=crop"];

  return (
    <div className="space-y-6">
      {/* Main Image with Gallery */}
      <div className="grid gap-4 lg:grid-cols-[1fr_150px]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl">
          <img
            src={images[selectedImage]}
            alt={pet.name}
            className="h-[500px] w-full object-cover"
          />
          
          {/* Image Overlay Actions */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className={`rounded-full p-3 shadow-lg backdrop-blur transition-all ${
                isFavorited
                  ? "bg-red-500 text-white"
                  : "bg-white/80 text-gray-900 hover:bg-white"
              }`}
            >
              <Heart size={24} fill={isFavorited ? "currentColor" : "none"} />
            </button>
            <button className="rounded-full bg-white/80 p-3 text-gray-900 shadow-lg backdrop-blur hover:bg-white transition-all">
              <Share2 size={24} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-4">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white shadow-lg ${
              pet.status === "available"
                ? "bg-green-600"
                : pet.status === "adopted"
                ? "bg-blue-600"
                : "bg-yellow-600"
            }`}>
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              {pet.status === "available" ? "Available" : pet.status === "adopted" ? "Adopted" : "Pending"}
            </span>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
          {images.map((img: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                selectedImage === idx
                  ? "border-blue-600 shadow-lg"
                  : "border-transparent hover:border-blue-300"
              }`}
            >
              <img src={img} alt={`${pet.name} ${idx}`} className="h-32 w-32 object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Pet Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<Weight className="w-6 h-6" />} label="Weight" value={`${pet.weight} kg`} />
        <InfoCard icon={<Calendar className="w-6 h-6" />} label="Age" value={`${pet.age} months`} />
        <InfoCard icon={<MapPin className="w-6 h-6" />} label="Color" value={pet.colour} />
        <InfoCard icon={<MessageCircle className="w-6 h-6" />} label="Temperament" value={pet.gender === "male" ? "Friendly" : "Affectionate"} />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2 text-blue-600">{icon}</div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 font-bold text-gray-900">{value}</p>
    </div>
  );
}
