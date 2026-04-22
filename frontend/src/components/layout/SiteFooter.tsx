import Link from "next/link";
import { PawPrint } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[#e8ddc8] bg-[#f8f2e2]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 text-sm text-[#475569] sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[#0f172a]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff9f1a] text-white">
              <PawPrint size={16} />
            </span>
            <span className="text-lg font-bold">PetPals</span>
          </div>
          <p>
            Connecting loving families with pets in need through practical,
            intelligent adoption support.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-bold text-[#0f172a]">Explore</h3>
          <ul className="space-y-2">
            <li><Link href="/pets" className="hover:text-[#f59e0b]">Find a Pet</Link></li>
            <li><Link href="/community" className="hover:text-[#f59e0b]">Community</Link></li>
            <li><Link href="/volunteer" className="hover:text-[#f59e0b]">Volunteer</Link></li>
            <li><Link href="/donate" className="hover:text-[#f59e0b]">Donate</Link></li>
            <li><Link href="/success-stories" className="hover:text-[#f59e0b]">Success Stories</Link></li>
            <li><Link href="/adoption-faq" className="hover:text-[#f59e0b]">Adoption FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-bold text-[#0f172a]">Resources</h3>
          <ul className="space-y-2">
            <li><Link href="/community" className="hover:text-[#f59e0b]">Pet Care Guides</Link></li>
            <li><Link href="/find-vet" className="hover:text-[#f59e0b]">Veterinary Search</Link></li>
            <li><Link href="/vet" className="hover:text-[#f59e0b]">Veterinary Workspace</Link></li>
            <li><Link href="/success-stories" className="hover:text-[#f59e0b]">Share a Story</Link></li>
            <li><Link href="/adoption-faq" className="hover:text-[#f59e0b]">Adoption FAQ</Link></li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#efd9ad] bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-bold text-[#0f172a]">Join our Newsletter</h3>
          <p className="mb-4 text-xs">
            Get the latest adoption stories and care tips.
          </p>
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2"
              placeholder="Email address"
            />
            <button className="rounded-lg bg-[#f59e0b] px-4 py-2 font-semibold text-white">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
