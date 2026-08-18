"use client";

import { useEffect, useState } from "react";
import GameCover from "@/components/GameCover";
import GameDetailPanel from "@/components/GameDetailPanel";
import HeaderWidgets from "@/components/HeaderWidgets";

type Game = { id: string; name: string; description: string | null; submitted_by?: string };

function bannerUrl(g: Game) {
  return `/store-games/${g.id}/banner.png`;
}

export default function LibraryPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [playing, setPlaying] = useState<Game | null>(null);
  const [viewingDetail, setViewingDetail] = useState<Game | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    fetch("/api/library").then((r) => r.json()).then(setGames);
  }

  async function removeFromLibrary(id: string) {
    if (!confirm("Remove this game from your library? You'd need to buy it again to get it back.")) return;
    await fetch(`/api/library/${id}`, { method: "DELETE" });
    setViewingDetail(null);
    load();
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold">Library</h2>
        <HeaderWidgets />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {games.length === 0 ? (
          <div className="text-center text-txt2 mt-10">
            <div className="text-sm text-txt1 mb-1">Your library is empty</div>
            Buy a game from the Store to see it here.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {games.map((g) => (
              <div key={g.id} onClick={() => setViewingDetail(g)} className="bg-bg2 border border-line rounded-xl overflow-hidden cursor-pointer hover:border-violet transition-colors">
                <GameCover bannerSrc={bannerUrl(g)} name={g.name} className="h-[110px] w-full" />
                <div className="p-4">
                  <div className="font-semibold text-sm mb-1">{g.name}</div>
                  {g.description && <div className="text-xs text-txt2 line-clamp-2">{g.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingDetail && (
        <GameDetailPanel
          mode="library"
          id={viewingDetail.id}
          name={viewingDetail.name}
          description={viewingDetail.description}
          addedBy={viewingDetail.submitted_by ?? ""}
          bannerSrc={bannerUrl(viewingDetail)}
          onClose={() => setViewingDetail(null)}
          onPlay={() => { setPlaying(viewingDetail); setViewingDetail(null); }}
          onRemove={() => removeFromLibrary(viewingDetail.id)}
        />
      )}

      {playing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setPlaying(null)} className="bg-bg2 border border-line rounded-md px-3 py-1.5 text-sm">← Back to Library</button>
            <h3 className="font-display text-lg font-bold">{playing.name}</h3>
          </div>
          <iframe src={`/store-games/${playing.id}/index.html`} sandbox="allow-scripts allow-pointer-lock"
            className="flex-1 w-full rounded-lg border border-line bg-white" />
        </div>
      )}
    </div>
  );
}
