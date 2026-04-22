"use client";

import { CheckCircle, AlertCircle, Heart } from "lucide-react";

interface PetDetailsTabProps {
  pet: any;
}

export function PetDetailsTab({ pet }: PetDetailsTabProps) {
  const tabs = ["Overview", "Health", "Adoption"];
  const [activeTab, setActiveTab] = useState<string>("Overview");

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8 space-y-6">
        {activeTab === "Overview" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">About {pet.name}</h3>
              <p className="text-gray-700 leading-relaxed">{pet.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Species" value={pet.species} />
              <InfoBlock label="Breed" value={pet.breed} />
              <InfoBlock label="Gender" value={pet.gender} />
              <InfoBlock label="Color" value={pet.colour} />
            </div>
          </div>
        )}

        {activeTab === "Health" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-green-900">Health Status</h4>
                  <p className="text-sm text-green-700">{pet.healthStatus || "Healthy and ready for adoption"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <HealthCheck label="Vaccinated" status={pet.isVaccinated} />
              <HealthCheck label="Neutered/Spayed" status={pet.isVaccinated} />
              <HealthCheck label="Microchipped" status={true} />
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
              <h4 className="font-bold text-blue-900 mb-3">Care Requirements</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Regular veterinary check-ups (annually)</li>
                <li>✓ Daily exercise and playtime</li>
                <li>✓ High-quality diet appropriate for age</li>
                <li>✓ Mental stimulation and enrichment</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "Adoption" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <AdoptionStep number="1" title="Submit Application" description="Fill out our adoption application form" />
              <AdoptionStep number="2" title="Review & Interview" description="We'll review your application and schedule a meet & greet" />
              <AdoptionStep number="3" title="Home Visit" description="Optional home visit to ensure the best fit" />
              <AdoptionStep number="4" title="Adoption Agreement" description="Sign the adoption agreement and complete the process" />
              <AdoptionStep number="5" title="Welcome Home!" description="Bring your new companion home" />
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Adoption Fee: $50</p>
                <p>This helps cover medical care, vaccinations, and shelter operations.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function HealthCheck({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-200">
      <p className="text-gray-900 font-medium">{label}</p>
      {status ? (
        <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
          <CheckCircle size={20} />
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-gray-600 font-semibold">
          <AlertCircle size={20} />
          No
        </span>
      )}
    </div>
  );
}

function AdoptionStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
          {number}
        </div>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

import { useState } from "react";
