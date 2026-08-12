"use client";

import { useEffect, useRef, useState } from "react";

type Game = { id: string; name: string; description: string | null; price: number; submitted_by: string; owned: boolean };

export default function StorePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [credits, setCredits] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [g, p] = await Promise.all([
      fetch("/api/store").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    setGames(g);
    setCredits(p.credits);
  }
  useEffect(() => {
    load();
  }, []);

  async function buy(id: string) {
    setError("");
    setMsg("");
    const res = await fetch(`/api/store/${id}/buy`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else {
      setMsg("Purchased! Find it in your Library.");
      load();
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!subName.trim() || !file) {
      setError("Name and a .zip file are required.");
      return;
    }
    const form = new FormData();
    form.append("name", subName.trim());
    form.append("description", subDesc.trim());
    form.append("file", file);
    setUploading(true);
    const res = await fetch("/api/store/submit", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) setError(data.error);
    else {
      setShowSubmit(false);
      setSubName("");
      setSubDesc("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Submitted for review! You'll see it in the Store once an admin approves it.");
      load();
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-3 bg-bg1">
        <h2 className="font-display text-lg font-bold">Store</h2>
        <span className="text-xs text-gold ml-2">{credits} coins</span>
        <button onClick={() => setShowSubmit(true)} className="ml-auto bg-bg3 border border-line rounded-md px-3.5 py-1.5 text-sm">
          Submit a game
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md mb-3 max-w-[560px]">{error}</div>}
        {msg && <div className="bg-online/10 border border-online/30 text-online text-sm px-3 py-2 rounded-md mb-3 max-w-[560px]">{msg}</div>}

        {games.length === 0 ? (
          <div className="text-center text-txt2 mt-10">No games in the store yet</div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {games.map((g) => (
              <div key={g.id} className="bg-bg2 border border-line rounded-xl p-4">
                <div className="font-semibold text-sm mb-1">{g.name}</div>
                {g.description && <div className="text-xs text-txt2 mb-3 line-clamp-2">{g.description}</div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gold font-semibold">{g.price === 0 ? "Free" : `${g.price} coins`}</span>
                  {g.owned ? (
                    <span className="text-[11px] text-online">Owned</span>
                  ) : (
                    <button onClick={() => buy(g.id)} className="bg-violet text-white rounded px-3 py-1.5 text-xs font-semibold">Buy</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSubmit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setShowSubmit(false)}>
          <form onSubmit={submit} className="bg-bg1 border border-line rounded-xl p-6 w-[380px]">
            <h3 className="font-display text-lg font-bold mb-4">Submit a game</h3>
            <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Game name"
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm mb-3" />
            <textarea value={subDesc} onChange={(e) => setSubDesc(e.target.value)} placeholder="Short description" rows={2}
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm mb-3 resize-none" />
            <input ref={fileRef} type="file" accept=".zip" className="w-full text-sm mb-1" />
            <div className="text-[11px] text-txt2 mb-4">Zip needs an index.html at its root. An admin will review it before it appears in the Store.</div>
            <div className="flex gap-2">
              <button type="submit" disabled={uploading} className="flex-1 bg-violet text-white rounded-md py-2 text-sm font-semibold">
                {uploading ? "Uploading..." : "Submit for review"}
              </button>
              <button type="button" onClick={() => setShowSubmit(false)} className="bg-bg2 border border-line rounded-md px-4 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
