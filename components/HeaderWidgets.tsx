"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notif = {
  id: string; type: string; title: string; body: string | null;
  link: string | null; read: boolean; created_at: string;
};

export default function HeaderWidgets({ pushRight = true }: { pushRight?: boolean }) {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const desktopEnabledRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  async function loadAll() {
    const [profile, data] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]);
    setCredits(profile.credits);
    desktopEnabledRef.current = !!profile.desktop_notifications;

    const newOnes = data.notifications.filter((n: Notif) => !seenIdsRef.current.has(n.id));
    if (!firstLoadRef.current && desktopEnabledRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const n of newOnes) {
        if (!n.read) new Notification(n.title, { body: n.body ?? undefined });
      }
    }
    firstLoadRef.current = false;
    seenIdsRef.current = new Set(data.notifications.map((n: Notif) => n.id));

    setNotifs(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 10000);

    // Browsers throttle setInterval hard in background/inactive tabs, so on
    // top of the base interval, refetch immediately the instant the tab
    // becomes visible/focused again — this is what actually fixes "I always
    // have to refresh" for anyone switching back from another tab.
    function onVisible() {
      if (document.visibilityState === "visible") loadAll();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  async function openNotif(n: Notif) {
    if (!n.read) await fetch(`/api/notifications/${n.id}/read`, { method: "POST" });
    setOpen(false);
    if (n.link) router.push(n.link);
    loadAll();
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    loadAll();
  }

  return (
    <div className={`flex items-center gap-4 ${pushRight ? "ml-auto" : ""}`}>
      {credits !== null && (
        <div className="text-xs text-gold font-semibold flex items-center gap-1 flex-shrink-0">🪙 {credits}</div>
      )}

      <div className="relative flex-shrink-0">
        <button onClick={() => setOpen((o) => !o)} className="relative text-txt1 hover:text-txt0 text-base">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-danger text-white text-[9px] rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-[320px] bg-bg1 border border-line rounded-lg shadow-xl z-[90] max-h-[420px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-line">
              <span className="text-xs font-semibold">Notifications</span>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-[11px] text-violet">Mark all read</button>}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifs.length === 0 ? (
                <div className="text-xs text-txt2 text-center py-6">Nothing yet</div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className={`px-3 py-2.5 border-b border-line cursor-pointer hover:bg-bg2 ${!n.read ? "bg-violet/5" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-violet mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-xs font-medium">{n.title}</div>
                        {n.body && <div className="text-[11px] text-txt2 mt-0.5">{n.body}</div>}
                        <div className="text-[10px] text-txt2 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
