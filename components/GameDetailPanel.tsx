"use client";

import { useEffect, useState } from "react";
import GameCover from "./GameCover";

type Achievement = { id: string; name: string; description: string | null; icon: string; threshold_score: number; unlocked?: boolean };

export default function GameDetailPanel({
  mode,
  id,
  name,
  description,
  addedBy,
  bannerSrc,
  price,
  owned,
  onClose,
  onPlay,
  onBuy,
  onRemove,
}: {
  mode: "arcade" | "store" | "library";
  id: string;
  name: string;
  description?: string | null;
  addedBy: string;
  bannerSrc: string;
  price?: number;
  owned?: boolean;
  onClose: () => void;
  onPlay?: () => void;
  onBuy?: () => void;
  onRemove?: () => void;
}) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<{ bestScore: number; totalPlays: number } | null>(null);

  useEffect(() => {
    if (mode === "arcade") {
      fetch(`/api/arcade/${id}/achievements`).then((r) => r.json()).then(setAchievements);
      fetch(`/api/arcade/${id}/stats`).then((r) => r.json()).then(setStats);
    }
  }, [mode, id]);

  return (
    <div className="fixed inset-0 z-[65]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute right-0 top-0 bottom-0 w-[380px] bg-bg1 border-l border-line flex flex-col shadow-2xl">
        <GameCover bannerSrc={bannerSrc} name={name} className="h-[160px] w-full flex-shrink-0" />

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-display text-xl font-bold">{name}</h3>
            <button onClick={onClose} className="text-txt2 hover:text-txt0 text-lg leading-none">✕</button>
          </div>
          <div className="text-xs text-txt2 font-mono mb-4">added by {addedBy}</div>

          {description && <p className="text-sm text-txt1 mb-5">{description}</p>}

          {mode === "arcade" && stats && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-bg2 border border-line rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wide text-txt2">Best score</div>
                <div className="text-xl font-bold text-gold">{stats.bestScore}</div>
              </div>
              <div className="bg-bg2 border border-line rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wide text-txt2">Times played</div>
                <div className="text-xl font-bold text-teal">{stats.totalPlays}</div>
              </div>
            </div>
          )}

          {mode === "arcade" && achievements.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] uppercase tracking-wide text-txt2 mb-2">Achievements</div>
              <div className="flex flex-col gap-1.5">
                {achievements.map((a) => (
                  <div key={a.id} className={`flex items-center gap-2 p-2 rounded-md ${a.unlocked ? "bg-gold/10" : "bg-bg2 opacity-50"}`}>
                    <span>{a.unlocked ? a.icon : "🔒"}</span>
                    <div className="text-xs">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-txt2">{a.description || `Reach ${a.threshold_score} points`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "store" && (
            <div className="mb-5">
              <span className="text-lg text-gold font-bold">{price === 0 ? "Free" : `${price} coins`}</span>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex gap-2">
          {(mode === "arcade" || mode === "library" || (mode === "store" && owned)) && (
            <button onClick={onPlay} className="flex-1 bg-violet text-white rounded-md py-2.5 text-sm font-semibold">▶ Play</button>
          )}
          {mode === "store" && !owned && (
            <button onClick={onBuy} className="flex-1 bg-violet text-white rounded-md py-2.5 text-sm font-semibold">Buy</button>
          )}
          {mode === "library" && (
            <button onClick={onRemove} className="bg-bg2 border border-line rounded-md px-4 text-xs text-danger">Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}
