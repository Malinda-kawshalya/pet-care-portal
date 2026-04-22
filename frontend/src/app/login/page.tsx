"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/auth";
import { setAuthState } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authState = await loginUser({ email, password });
      setAuthState(authState);
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffedd5_0%,#fff6ed_32%,#eff6ff_66%,#e0f2fe_100%)] px-4 py-12">
      <div className="absolute left-[-100px] top-[-120px] h-[280px] w-[280px] rounded-full bg-[#f97316]/20 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-100px] h-[320px] w-[320px] rounded-full bg-[#0ea5e9]/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[#f7d7be] bg-white shadow-[0_28px_70px_-35px_rgba(30,64,175,0.45)] md:grid md:grid-cols-2">
        <section className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?q=80&w=1200&auto=format&fit=crop"
            alt="Happy dog and owner in Sri Lanka style warm daylight"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/20 bg-black/30 p-5 text-white backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Pet Care Sri Lanka</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/85">
              Continue applications, care guides, and health reminders for your pets.
            </p>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <h2 className="text-3xl font-black tracking-tight text-[#0f172a]">Log in</h2>
          <p className="mt-2 text-sm text-[#64748b]">Sign in to your pet care dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-[#0f172a]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#f97316]"
              />
            </label>

            <label className="block text-sm font-semibold text-[#0f172a]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#f97316]"
              />
            </label>

            {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#ea580c] px-4 py-3 font-semibold text-white shadow-lg shadow-[#ea580c]/35 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="font-semibold text-[#ea580c]">
              Forgot password?
            </Link>
            <Link
              href={searchParams.get("redirect")
                ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect") || "")}`
                : "/register"}
              className="font-semibold text-[#0f172a]"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
