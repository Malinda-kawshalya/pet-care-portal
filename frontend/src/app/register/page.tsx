"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "@/lib/auth";
import { setAuthState } from "@/lib/auth-storage";
import type { UserRole } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "user" as UserRole,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizeSriLankanPhone(form.phone);
      if (!normalizedPhone) {
        throw new Error("Use a valid Sri Lankan number like 0771234567 or +94771234567");
      }

      const authState = await registerUser({
        fullName: form.fullName,
        email: form.email,
        phone: normalizedPhone,
        password: form.password,
        role: form.role,
      });
      setAuthState(authState);
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,#dff6ff_0%,#eef9ff_32%,#fff7ed_70%,#fff1f2_100%)] px-4 py-12">
      <div className="absolute left-[-120px] top-[-100px] h-[300px] w-[300px] rounded-full bg-[#0ea5e9]/20 blur-3xl" />
      <div className="absolute bottom-[-130px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#f97316]/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[#d6ecff] bg-white shadow-[0_28px_70px_-35px_rgba(14,116,144,0.45)] md:grid md:grid-cols-2">
        <section className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop"
            alt="Puppy on tropical grass"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/20 bg-black/30 p-5 text-white backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Sri Lanka Ready</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight">Create your account</h1>
            <p className="mt-2 text-sm text-white/85">
              Register as an adopter or vet and start helping pets find loving homes.
            </p>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <h2 className="text-3xl font-black tracking-tight text-[#0f172a]">Join PetAI</h2>
          <p className="mt-2 text-sm text-[#64748b]">Create your profile and start your pet journey.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-[#0f172a]">
              Full name
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#0ea5e9]"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0f172a]">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#0ea5e9]"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0f172a]">
              Phone (+94...)
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="0771234567 or +94771234567"
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#0ea5e9]"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0f172a]">
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#0ea5e9]"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0f172a]">
              Account Type
              <select
                value={form.role}
                onChange={(event) => updateField("role", event.target.value as UserRole)}
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#0ea5e9]"
              >
                <option value="user">Adopter</option>
                <option value="veterinarian">Vet</option>
              </select>
            </label>

            {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0891b2] px-4 py-3 font-semibold text-white shadow-lg shadow-[#0891b2]/35 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-[#475569]">
            Already have an account?{" "}
            <Link
              href={searchParams.get("redirect")
                ? `/login?redirect=${encodeURIComponent(searchParams.get("redirect") || "")}`
                : "/login"}
              className="font-semibold text-[#0891b2]"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function normalizeSriLankanPhone(value: string) {
  const raw = value.replace(/\s|-/g, "");

  if (/^\+94\d{9}$/.test(raw)) {
    return raw;
  }

  if (/^94\d{9}$/.test(raw)) {
    return `+${raw}`;
  }

  if (/^0\d{9}$/.test(raw)) {
    return `+94${raw.slice(1)}`;
  }

  return null;
}
