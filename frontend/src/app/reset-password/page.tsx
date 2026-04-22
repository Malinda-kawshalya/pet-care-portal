"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoadingState />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Missing reset token. Open the link from your email again.");
      return;
    }

    setLoading(true);
    try {
      const responseMessage = await resetPassword({ token, newPassword });
      setMessage(responseMessage);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-[#dce6fa] bg-white p-8 shadow-xl shadow-[#2f66ff]/10">
        <h1 className="text-3xl font-extrabold text-[#0f172a]">Reset password</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Create a new secure password with at least 8 characters, one number, and one special character.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-[#0f172a]">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
            />
          </label>

          {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
          {message ? <p className="text-sm text-[#16a34a]">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2f66ff] px-4 py-3 font-semibold text-white shadow-lg shadow-[#2f66ff]/35 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[#475569]">
          <Link href="/login" className="font-semibold text-[#2f66ff]">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

function ResetPasswordLoadingState() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <p className="text-sm text-[#64748b]">Loading reset form...</p>
    </main>
  );
}
