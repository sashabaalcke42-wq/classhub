"use client";

import { useEffect, useState } from "react";
import HeaderWidgets from "@/components/HeaderWidgets";

type Entry = { account_name: string; display_name: string; avatar_path: string | null; value: number };
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
function avatarUrl(path: string | null) {
  return path ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
}

const BOARDS = [
  { id: "coins", label: "Most Coins", unit: "coins" },
  { id: "friends", label: "Most Friends", unit: "friends" },
  { id: "quiz", label: "Most Correct Answers", unit: "correct" },
];

export default function LeaderboardsPage() {
  const [board, setBoard] = useState("coins");
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch(`/api/leaderboards?type=${board}`).then((r) => r.json()).then(setEntries);
  }, [board]);

  const unit = BOARDS.find((b) => b.id === board)?.unit ?? "";

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-3 bg-bg1">
        <h2 className="font-display text-lg font-bold">Leaderboards</h2>
        <HeaderWidgets />
      </div>
      <div className="px-5 pt-4 flex gap-2">
        {BOARDS.map((b) => (
          <div key={b.id} onClick={() => setBoard(b.id)}
            className={`px-3.5 py-1.5 rounded-md text-sm cursor-pointer border ${board === b.id ? "bg-violet text-white border-violet" : "bg-bg2 text-txt1 border-line"}`}>
            {b.label}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-1 max-w-[480px]">
          {entries.map((e, i) => {
            const url = avatarUrl(e.avatar_path);
            return (
              <div key={e.account_name} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg2">
                <div className={`w-6 text-center font-display font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-txt1" : i === 2 ? "text-[#cd7f32]" : "text-txt2"}`}>
                  {i + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-bg3 overflow-hidden flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : e.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 text-sm font-medium">{e.display_name}</div>
                <div className="text-sm text-gold font-semibold">{e.value} {unit}</div>
              </div>
            );
          })}
          {entries.length === 0 && <div className="text-center text-txt2 mt-10">No data yet</div>}
        </div>
      </div>
    </div>
  );
}
