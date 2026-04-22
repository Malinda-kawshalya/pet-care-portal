import Link from "next/link";
import { MapPin } from "lucide-react";

type PetCardProps = {
  id: string;
  name: string;
  breed: string;
  age: string;
  location: string;
  image: string;
};

export function PetCard({ id, name, breed, age, location, image }: PetCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce4f5] bg-white shadow-[0_16px_40px_-28px_rgba(37,99,235,0.5)]">
      <div
        className="h-44 bg-cover bg-center"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />
      <div className="space-y-3 p-3">
        <div>
          <h3 className="text-base font-bold text-[#0f172a]">{name}</h3>
          <p className="text-xs text-[#64748b]">
            {breed} • {age}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#94a3b8]">
            <MapPin size={12} />
            {location}
          </p>
        </div>

        <div className="flex gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#e2edff] px-2 py-1 text-[#2563eb]">
            Vaccinated
          </span>
          <span className="rounded-full bg-[#dcfce7] px-2 py-1 text-[#16a34a]">
            Friendly
          </span>
        </div>

        <Link
          href={`/pets/${id}`}
          className="block w-full rounded-lg bg-[#2f66ff] px-3 py-2 text-center text-sm font-semibold text-white"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
