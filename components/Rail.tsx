"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Group = { id: string; name: string };

function initials(name: string) {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}
function colorFor(seed: string) {
  const colors = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];
  let h = 0;
  for (const c of seed || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export default function Rail({
  accountName,
  displayName,
  isAdmin,
}: {
  accountName: string;
  displayName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
  }, []);

  async function createGroup() {
    const name = prompt("Group name:");
    if (!name) return;
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const group = await res.json();
    if (res.ok) router.push(`/dashboard/group/${group.id}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const iconBase =
    "w-[46px] h-[46px] rounded-xl bg-bg2 flex items-center justify-center text-lg text-txt1 hover:bg-[#5a42b8] hover:text-white cursor-pointer transition-colors";
  const active = "!bg-violet !text-white";

  return (
    <div className="w-[72px] bg-bg1 border-r border-line flex flex-col items-center py-3.5 gap-2.5">
      <div
        className={`${iconBase} ${pathname === "/dashboard" ? active : ""}`}
        title="Global chat"
        onClick={() => router.push("/dashboard")}
      >
        🌐
      </div>
      <div className="w-8 h-px bg-line my-1" />

      {groups.map((g) => (
        <div
          key={g.id}
          className={`${iconBase} ${pathname === `/dashboard/group/${g.id}` ? active : ""}`}
          title={g.name}
          onClick={() => router.push(`/dashboard/group/${g.id}`)}
        >
          {initials(g.name)}
        </div>
      ))}
      <div className="w-[46px] h-[46px] rounded-xl border border-dashed border-line text-txt2 flex items-center justify-center cursor-pointer hover:text-txt0"
        title="Create group" onClick={createGroup}>
        +
      </div>

      <div className="w-8 h-px bg-line my-1" />
      <div className={`${iconBase} ${pathname.startsWith("/dashboard/friends") || pathname.startsWith("/dashboard/dm") ? active : ""}`}
        title="Friends & DMs" onClick={() => router.push("/dashboard/friends")}>
        👥
      </div>
      <div className={`${iconBase} ${pathname === "/dashboard/arcade" ? active : ""}`}
        title="Arcade" onClick={() => router.push("/dashboard/arcade")}>
        🕹️
      </div>
      <div className={`${iconBase} ${pathname === "/dashboard/directory" ? active : ""}`}
        title="Directory" onClick={() => router.push("/dashboard/directory")}>
        🔍
      </div>
      <div className={`${iconBase} ${pathname === "/dashboard/leaderboards" ? active : ""}`}
        title="Leaderboards" onClick={() => router.push("/dashboard/leaderboards")}>
        🏆
      </div>
      {isAdmin && (
        <div className={`${iconBase} ${pathname === "/dashboard/admin" ? active : ""} !text-gold`}
          title="Admin" onClick={() => router.push("/dashboard/admin")}>
          🛠️
        </div>
      )}

      <div className="flex-1" />
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer text-bg0 ${pathname === "/dashboard/profile" ? "ring-2 ring-violet" : ""}`}
        style={{ background: colorFor(accountName) }}
        title={displayName}
        onClick={() => router.push("/dashboard/profile")}
      >
        {initials(displayName)}
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-txt2 hover:text-danger cursor-pointer"
        title="Log out"
        onClick={logout}
      >
        ⏻
      </div>
    </div>
  );
}
