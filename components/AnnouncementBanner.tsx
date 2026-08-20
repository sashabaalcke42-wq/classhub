"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "classhub_dismissed_announcement";

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState("");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const text = data.announcement || "";
        setAnnouncement(text);
        const lastDismissed = typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null;
        setDismissed(!text || lastDismissed === text);
      });
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, announcement);
    setDismissed(true);
  }

  if (dismissed || !announcement) return null;

  return (
    <div className="h-[36px] flex-shrink-0 bg-violet flex items-center justify-center px-4 gap-3 text-white">
      <span className="text-xs font-medium truncate">📣 {announcement}</span>
      <button onClick={dismiss} className="text-xs opacity-80 hover:opacity-100 flex-shrink-0">✕</button>
    </div>
  );
}
