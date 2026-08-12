"use client";

import { useEffect, useRef, useState } from "react";

type Game = {
  id: string;
  name: string;
  storage_path: string;
  added_by: string;
  created_at: string;
  reward_rate?: number;
  daily_limit?: number;
  cooldown_seconds?: number;
};
type Achievement = { id: string; name: string; description: string | null; icon: string; threshold_score: number; unlocked?: boolean };

function colorFor(seed: string) {
  const colors = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];
  let h = 0;
  for (const c of seed || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

function playUrl(g: Game) {
  return `/games/${g.id}/index.html`;
}

export default function ArcadePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [me, setMe] = useState<{ isAdmin: boolean } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [playing, setPlaying] = useState<Game | null>(null);
  const [achievementsFor, setAchievementsFor] = useState<Game | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [configuring, setConfiguring] = useState<Game | null>(null);
  const [popup, setPopup] = useState<{ coins: number; achievements: Achievement[] } | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const gameIframeRef = useRef<HTMLIFrameElement>(null);

  async function load() {
    const [g, s] = await Promise.all([
      fetch("/api/games").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setGames(g);
    setMe(s);
  }
  useEffect(() => {
    load();
  }, []);

  // Listen for score reports from the playing game's iframe. Games call:
  //   window.parent.postMessage({ channel: 'classhub-arcade', type: 'game-over', score: N }, window.location.origin)
  //
  // Note: the game iframe is sandboxed WITHOUT allow-same-origin (on purpose,
  // for security), which means its postMessage always reports origin "null"
  // to us — so we can't check e.origin. Instead we verify the message came
  // from this exact iframe by comparing e.source to its contentWindow.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!playing) return;
      if (e.source !== gameIframeRef.current?.contentWindow) return;
      if (e.data?.channel !== "classhub-arcade" || e.data?.type !== "game-over") return;

      fetch(`/api/arcade/${playing.id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: e.data.score }),
      })
        .then((r) => r.json())
        .then((data) => {
          setPopup({ coins: data.coinsAwarded ?? 0, achievements: data.newAchievements ?? [] });
        });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    const file = fileRef.current?.files?.[0];
    if (!uploadName.trim() || !file) {
      setUploadError("Name and .zip file are required.");
      return;
    }
    const form = new FormData();
    form.append("name", uploadName.trim());
    form.append("file", file);
    setUploading(true);
    const res = await fetch("/api/games", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error ?? "Upload failed");
      return;
    }
    setShowUpload(false);
    setUploadName("");
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this game?")) return;
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    load();
  }

  async function openAchievements(g: Game) {
    setAchievementsFor(g);
    setAchievements(await fetch(`/api/arcade/${g.id}/achievements`).then((r) => r.json()));
  }

  const admin = me?.isAdmin;

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-3 bg-bg1">
        <h2 className="font-display text-lg font-bold">Arcade</h2>
        {admin && (
          <button
            onClick={() => setShowUpload(true)}
            className="ml-auto bg-violet text-white rounded-md px-3.5 py-1.5 text-sm font-semibold"
          >
            + Add game
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {games.length === 0 ? (
          <div className="text-center text-txt2 mt-10">
            <div className="text-sm text-txt1 mb-1">No games yet</div>
            {admin ? "Add one to get started." : "Ask an admin to add some games."}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-bg2 border border-line rounded-xl overflow-hidden hover:border-violet hover:-translate-y-0.5 transition-all"
              >
                <div
                  onClick={() => setPlaying(g)}
                  className="h-[100px] flex items-center justify-center text-3xl cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${colorFor(g.name)}, #12141d)` }}
                >
                  🎮
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm mb-0.5">{g.name}</div>
                  <div className="text-[11px] text-txt2 mb-2">added by {g.added_by}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openAchievements(g)} className="text-[11px] text-gold">🏆 Achievements</button>
                    {admin && (
                      <>
                        <button onClick={() => setConfiguring(g)} className="text-[11px] text-txt2 hover:text-txt0 ml-auto">Configure</button>
                        <button onClick={() => remove(g.id)} className="text-[11px] text-txt2 hover:text-danger">Remove</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}>
          <form onSubmit={upload} className="bg-bg1 border border-line rounded-xl p-6 w-[380px]">
            <h3 className="font-display text-lg font-bold mb-4">Add a game</h3>
            {uploadError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md mb-3">
                {uploadError}
              </div>
            )}
            <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">Game name</label>
            <input
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm mb-3 outline-none focus:border-violet"
              placeholder="Cool Game"
            />
            <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">Game .zip file</label>
            <input ref={fileRef} type="file" accept=".zip" className="w-full text-sm mb-1" />
            <div className="text-[11px] text-txt2 mb-4">
              The zip must contain an <span className="font-mono">index.html</span> at its root (or inside a single wrapper folder) — that's the game's entry page.
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={uploading} className="flex-1 bg-violet text-white rounded-md py-2 text-sm font-semibold">
                {uploading ? "Uploading..." : "Add to arcade"}
              </button>
              <button type="button" onClick={() => setShowUpload(false)} className="bg-bg2 border border-line rounded-md px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {playing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setPlaying(null)} className="bg-bg2 border border-line rounded-md px-3 py-1.5 text-sm">
              ← Back to Arcade
            </button>
            <h3 className="font-display text-lg font-bold">{playing.name}</h3>
          </div>
          <iframe
            ref={gameIframeRef}
            src={playUrl(playing)}
            sandbox="allow-scripts allow-pointer-lock"
            className="flex-1 w-full rounded-lg border border-line bg-white"
          />
          {popup && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={() => setPopup(null)}>
              <div className="bg-bg1 border border-violet rounded-xl p-6 w-[340px] text-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-display text-lg font-bold mb-3">Game Over</h3>
                {popup.coins > 0 ? (
                  <div className="text-2xl text-gold font-bold mb-3">+{popup.coins} coins</div>
                ) : (
                  <div className="text-sm text-txt2 mb-3">No coins this round</div>
                )}
                {popup.achievements.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {popup.achievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 bg-gold/10 rounded-md px-3 py-2">
                        <span className="text-xl">{a.icon}</span>
                        <div className="text-left">
                          <div className="text-sm font-semibold">{a.name} unlocked!</div>
                          {a.description && <div className="text-[11px] text-txt2">{a.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setPopup(null)} className="w-full bg-violet text-white rounded-md py-2 text-sm font-semibold">
                  Nice!
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {achievementsFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setAchievementsFor(null)}>
          <div className="bg-bg1 border border-line rounded-xl p-6 w-[380px]">
            <h3 className="font-display text-lg font-bold mb-4">{achievementsFor.name} — Achievements</h3>
            {achievements.length === 0 ? (
              <div className="text-sm text-txt2">No achievements set for this game yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {achievements.map((a) => (
                  <div key={a.id} className={`flex items-center gap-3 p-2 rounded-md ${a.unlocked ? "bg-gold/10" : "bg-bg2 opacity-50"}`}>
                    <span className="text-xl">{a.unlocked ? a.icon : "🔒"}</span>
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-[11px] text-txt2">{a.description || `Reach ${a.threshold_score} points`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setAchievementsFor(null)} className="mt-4 bg-bg2 border border-line rounded-md px-4 py-2 text-sm w-full">Close</button>
          </div>
        </div>
      )}

      {configuring && (
        <ConfigureGameModal game={configuring} onClose={() => setConfiguring(null)} />
      )}
    </div>
  );
}

function ConfigureGameModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const [rewardRate, setRewardRate] = useState(String(game.reward_rate ?? 1));
  const [dailyLimit, setDailyLimit] = useState(String(game.daily_limit ?? 200));
  const [cooldown, setCooldown] = useState(String(game.cooldown_seconds ?? 5));
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newName, setNewName] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [newIcon, setNewIcon] = useState("🏆");

  async function loadAch() {
    setAchievements(await fetch(`/api/admin/games/${game.id}/achievements`).then((r) => r.json()));
  }
  useEffect(() => {
    loadAch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveConfig() {
    await fetch(`/api/games/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardRate, dailyLimit, cooldownSeconds: cooldown }),
    });
    onClose();
  }

  async function addAchievement() {
    if (!newName.trim() || !newThreshold) return;
    await fetch(`/api/admin/games/${game.id}/achievements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, thresholdScore: newThreshold, icon: newIcon }),
    });
    setNewName("");
    setNewThreshold("");
    loadAch();
  }
  async function removeAchievement(id: string) {
    await fetch(`/api/admin/games/${game.id}/achievements/${id}`, { method: "DELETE" });
    loadAch();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg1 border border-line rounded-xl p-6 w-[420px] max-h-[85vh] overflow-y-auto">
        <h3 className="font-display text-lg font-bold mb-4">Configure "{game.name}"</h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label className="block text-[11px] text-txt2 mb-1">Coins / point</label>
            <input value={rewardRate} onChange={(e) => setRewardRate(e.target.value)} className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] text-txt2 mb-1">Daily cap</label>
            <input value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] text-txt2 mb-1">Cooldown (s)</label>
            <input value={cooldown} onChange={(e) => setCooldown(e.target.value)} className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          </div>
        </div>
        <button onClick={saveConfig} className="w-full bg-violet text-white rounded-md py-2 text-sm font-semibold mb-5">Save reward settings</button>

        <h4 className="text-xs uppercase tracking-wide text-txt2 mb-2">Achievements</h4>
        {achievements.map((a) => (
          <div key={a.id} className="flex items-center gap-2 bg-bg2 rounded-md px-2 py-1.5 mb-1.5">
            <span>{a.icon}</span>
            <span className="text-sm flex-1">{a.name} — {a.threshold_score} pts</span>
            <button onClick={() => removeAchievement(a.id)} className="text-xs text-danger">✕</button>
          </div>
        ))}
        <div className="flex gap-1.5 mt-2">
          <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-10 bg-bg2 border border-line rounded-md px-1 py-1.5 text-sm text-center" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Achievement name" className="flex-1 bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          <input value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="Score" type="number" className="w-16 bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          <button onClick={addAchievement} className="bg-bg3 border border-line rounded-md px-2 text-sm">+</button>
        </div>

        <button onClick={onClose} className="w-full bg-bg2 border border-line rounded-md py-2 text-sm mt-5">Close</button>
      </div>
    </div>
  );
}
