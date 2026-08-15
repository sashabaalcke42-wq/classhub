"use client";

import { useState } from "react";

function colorFor(seed: string) {
  const colors = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];
  let h = 0;
  for (const c of seed || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export default function GameCover({
  bannerSrc,
  name,
  icon = "🎮",
  className = "",
}: {
  bannerSrc: string;
  name: string;
  icon?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center text-3xl ${className}`}
        style={{ background: `linear-gradient(135deg, ${colorFor(name)}, #12141d)` }}
      >
        {icon}
      </div>
    );
  }

  return (
    <img
      src={bannerSrc}
      alt=""
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
