"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import type { AppNotification } from "@/types/notifications";

type NotificationBellProps = {
  isLoggedIn: boolean;
};

function formatRelativeDate(input: string) {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ isLoggedIn }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const payload = await fetchNotifications({ limit: 12 });
        if (!active) {
          return;
        }
        setItems(payload.notifications);
        setUnreadCount(payload.unreadCount);
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", onDocumentClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, [open]);

  const unreadItems = useMemo(
    () => items.filter((item) => !item.readAt),
    [items]
  );

  if (!isLoggedIn) {
    return null;
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
  }

  async function handleItemClick(item: AppNotification) {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, readAt: new Date().toISOString() }
            : currentItem
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    if (item.link) {
      window.location.href = item.link;
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8dfef] bg-white text-[#1e293b]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 justify-center rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-[340px] overflow-hidden rounded-2xl border border-[#dbe5f8] bg-white shadow-2xl shadow-[#2f66ff]/15">
          <div className="flex items-center justify-between border-b border-[#eaf0fb] px-4 py-3">
            <p className="text-sm font-bold text-[#0f172a]">Notifications</p>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f66ff]"
              disabled={!unreadItems.length}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-4 text-sm text-[#64748b]">Loading notifications...</p>
            ) : items.length ? (
              items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => void handleItemClick(item)}
                  className={`block w-full border-b border-[#f1f5fd] px-4 py-3 text-left hover:bg-[#f8fbff] ${
                    item.readAt ? "bg-white" : "bg-[#f0f6ff]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#475569]">{item.message}</p>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">{formatRelativeDate(item.createdAt)}</p>
                </button>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-[#64748b]">No notifications yet.</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#eaf0fb] px-4 py-3">
            <Link href="/settings/notifications" className="text-xs font-semibold text-[#2f66ff]">
              Notification Settings
            </Link>
            <span className="text-[11px] text-[#94a3b8]">Unread: {unreadCount}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
