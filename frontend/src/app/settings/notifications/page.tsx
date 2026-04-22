"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthState } from "@/lib/auth-storage";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";
import type { NotificationPreferences } from "@/types/notifications";

const labels: Record<keyof NotificationPreferences["types"], string> = {
  registration: "Registration & account welcome",
  passwordReset: "Password reset and recovery",
  applicationStatus: "Adoption application updates",
  healthReminder: "Health and reminder events",
  qrScanEvent: "QR and lost/found activity",
  community: "Community likes/comments",
  chatAssistant: "AI assistant updates",
  security: "Security alerts",
  system: "System announcements",
};

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      router.replace("/login");
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const result = await fetchNotificationPreferences();
        if (!active) {
          return;
        }
        setPrefs(result);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notification preferences"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const preferenceKeys = useMemo(
    () => (prefs ? (Object.keys(prefs.types) as Array<keyof NotificationPreferences["types"]>) : []),
    [prefs]
  );

  function setChannel(key: keyof NotificationPreferences["channels"], value: boolean) {
    setPrefs((current) =>
      current
        ? {
            ...current,
            channels: {
              ...current.channels,
              [key]: value,
            },
          }
        : current
    );
  }

  function setTypeChannel(
    typeKey: keyof NotificationPreferences["types"],
    channel: keyof NotificationPreferences["channels"],
    value: boolean
  ) {
    setPrefs((current) =>
      current
        ? {
            ...current,
            types: {
              ...current.types,
              [typeKey]: {
                ...current.types[typeKey],
                [channel]: value,
              },
            },
          }
        : current
    );
  }

  async function handleSave() {
    if (!prefs) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateNotificationPreferences({
        channels: prefs.channels,
        types: prefs.types,
      });
      setPrefs(updated);
      setMessage("Preferences saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save notification preferences"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
        <p className="text-sm text-[#64748b]">Loading notification preferences...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <section className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2f66ff]">
            Account Settings
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Notification Preferences</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            In-app notifications are always enabled. You can manage email notifications below.
          </p>
        </section>

        {error ? (
          <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {message}
          </p>
        ) : null}

        {prefs ? (
          <section className="mt-8 rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0f172a]">Global Email Preference</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ToggleCard
                title="Email notifications"
                checked={prefs.channels.email}
                onChange={(value) => setChannel("email", value)}
              />
            </div>

            <h2 className="mt-8 text-xl font-bold text-[#0f172a]">By Notification Type</h2>
            <div className="mt-4 space-y-3">
              {preferenceKeys.map((key) => (
                <article
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3ebfa] bg-[#fafcff] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#0f172a]">{labels[key]}</p>
                  <div className="flex gap-4">
                    <InlineToggle
                      label="Email"
                      checked={prefs.types[key].email}
                      onChange={(value) => setTypeChannel(key, "email", value)}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-full bg-[#2f66ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function ToggleCard({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e3ebfa] bg-[#fafcff] px-4 py-3">
      <span className="text-sm font-semibold text-[#0f172a]">{title}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#cbd5e1]"
      />
    </label>
  );
}

function InlineToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#cbd5e1]"
      />
      {label}
    </label>
  );
}
