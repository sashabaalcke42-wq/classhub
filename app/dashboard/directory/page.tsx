"use client";

import { useEffect, useState } from "react";

type Person = { account_name: string; display_name: string; avatar_path: string | null; credits: number };
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
function avatarUrl(path: string | null) {
  return path ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
}

export default function DirectoryPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "coins" | "joined">("name");
  const [friendState, setFriendState] = useState<{ friends: string[]; outgoing: string[]; requests: string[]; blocked: string[] }>({
    friends: [], outgoing: [], requests: [], blocked: [],
  });
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const [p, f] = await Promise.all([
      fetch(`/api/users?search=${encodeURIComponent(search)}&sort=${sort}`).then((r) => r.json()),
      fetch("/api/friends").then((r) => r.json()),
    ]);
    setPeople(p);
    setFriendState(f);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  async function sendRequest(acc: string) {
    setBusy(acc);
    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName: acc }),
    });
    setBusy(null);
    load();
  }

  function statusFor(acc: string) {
    if (friendState.friends.includes(acc)) return "friend";
    if (friendState.outgoing.includes(acc)) return "pending";
    if (friendState.requests.includes(acc)) return "respond";
    if (friendState.blocked.includes(acc)) return "blocked";
    return "none";
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-3 bg-bg1">
        <h2 className="font-display text-lg font-bold">Directory</h2>
      </div>
      <div className="px-5 pt-4 flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by name..."
          className="bg-bg2 border border-line rounded-md px-3 py-1.5 text-sm outline-none focus:border-violet flex-1 min-w-[180px]"
        />
        <button onClick={load} className="bg-bg3 border border-line rounded-md px-3 py-1.5 text-sm">Search</button>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)}
          className="bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm">
          <option value="name">A–Z</option>
          <option value="coins">Most coins</option>
          <option value="joined">Newest</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-1">
          {people.map((p) => {
            const status = statusFor(p.account_name);
            const url = avatarUrl(p.avatar_path);
            return (
              <div key={p.account_name} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg2">
                <div className="w-9 h-9 rounded-full bg-bg3 overflow-hidden flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : p.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.display_name}</div>
                  <div className="text-[11px] text-txt2 font-mono">{p.account_name} · {p.credits} coins</div>
                </div>
                {status === "friend" && <span className="text-[11px] text-online">Friends</span>}
                {status === "pending" && <span className="text-[11px] text-txt2">Request sent</span>}
                {status === "respond" && <span className="text-[11px] text-gold">Wants to be friends</span>}
                {status === "blocked" && <span className="text-[11px] text-danger">Blocked</span>}
                {status === "none" && (
                  <button
                    disabled={busy === p.account_name}
                    onClick={() => sendRequest(p.account_name)}
                    className="bg-violet text-white rounded px-3 py-1.5 text-xs font-semibold"
                  >
                    Add friend
                  </button>
                )}
              </div>
            );
          })}
          {people.length === 0 && <div className="text-center text-txt2 mt-10">No users found</div>}
        </div>
      </div>
    </div>
  );
}
