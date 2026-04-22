"use client";

import { useEffect, useMemo, useState } from "react";
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

export function AdminSettingsPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
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

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

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
      <section className="rounded-3xl border border-[#d8deee] bg-white p-8 shadow-sm">
        <p className="text-sm text-[#64748b]">Loading notification preferences...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <article className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Admin Settings</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">Notification Preferences</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Manage global and per-type email notification behavior without leaving the dashboard.
        </p>
      </article>

      {error ? (
        <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
          {message}
        </div>
      ) : null}

      {prefs ? (
        <article className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0f172a]">Global Channels</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ToggleCard
              title="In-app notifications"
              checked={prefs.channels.inApp}
              onChange={(value) => setChannel("inApp", value)}
            />
            <ToggleCard
              title="Email notifications"
              checked={prefs.channels.email}
              onChange={(value) => setChannel("email", value)}
            />
          </div>

          <h3 className="mt-8 text-lg font-bold text-[#0f172a]">By Notification Type</h3>
          <div className="mt-4 space-y-3">
            {preferenceKeys.map((key) => (
              <article
                key={key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3ebfa] bg-[#fafcff] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[#0f172a]">{labels[key]}</p>
                <div className="flex gap-4">
                  <InlineToggle
                    label="In app"
                    checked={prefs.types[key].inApp}
                    onChange={(value) => setTypeChannel(key, "inApp", value)}
                  />
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
        </article>
      ) : null}
    </section>
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
