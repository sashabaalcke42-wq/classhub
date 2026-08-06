"use client";

import { useEffect, useRef, useState } from "react";

type Game = {
  id: string;
  name: string;
  storage_path: string;
  added_by: string;
  created_at: string;
};

function colorFor(seed: string) {
  const colors = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];
  let h = 0;
  for (const c of seed || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function playUrl(g: Game) {
  return `${SUPABASE_URL}/storage/v1/object/public/games/${g.storage_path}/index.html`;
}

export default function ArcadePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [me, setMe] = useState<{ isAdmin: boolean } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [playing, setPlaying] = useState<Game | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
                className="bg-bg2 border border-line rounded-xl overflow-hidden cursor-pointer hover:border-violet hover:-translate-y-0.5 transition-all"
              >
                <div
                  onClick={() => setPlaying(g)}
                  className="h-[100px] flex items-center justify-center text-3xl"
                  style={{ background: `linear-gradient(135deg, ${colorFor(g.name)}, #12141d)` }}
                >
                  🎮
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm mb-0.5">{g.name}</div>
                  <div className="text-[11px] text-txt2 flex items-center justify-between">
                    <span>added by {g.added_by}</span>
                    {admin && (
                      <button
                        className="text-txt2 hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(g.id);
                        }}
                      >
                        remove
                      </button>
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
            src={playUrl(playing)}
            sandbox="allow-scripts allow-pointer-lock"
            className="flex-1 w-full rounded-lg border border-line bg-white"
          />
        </div>
      )}
    </div>
  );
}
