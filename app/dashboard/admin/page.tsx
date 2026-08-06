"use client";

import { useEffect, useState } from "react";

type User = { account_name: string; display_name: string; is_admin: boolean; created_at: string };
type Group = { id: string; name: string; created_by: string; memberCount: number };
type DMConv = { key: string; accountA: string; accountB: string; messageCount: number };
type Game = { id: string; name: string; added_by: string };
type DMMsg = { id: string; display_name: string; body: string; created_at: string };

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "groups" | "dms" | "games">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dms, setDms] = useState<DMConv[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [viewingDM, setViewingDM] = useState<DMConv | null>(null);
  const [dmMsgs, setDmMsgs] = useState<DMMsg[]>([]);
  const [me, setMe] = useState<string>("");

  async function loadUsers() {
    const [u, s] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setUsers(u);
    setMe(s.accountName);
  }
  async function loadGroups() {
    setGroups(await fetch("/api/admin/groups").then((r) => r.json()));
  }
  async function loadDMs() {
    setDms(await fetch("/api/admin/dms").then((r) => r.json()));
  }
  async function loadGames() {
    setGames(await fetch("/api/games").then((r) => r.json()));
  }

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "groups") loadGroups();
    if (tab === "dms") loadDMs();
    if (tab === "games") loadGames();
    setViewingDM(null);
  }, [tab]);

  async function toggleAdmin(accountName: string, isAdmin: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName, isAdmin: !isAdmin }),
    });
    loadUsers();
  }
  async function deleteUser(accountName: string) {
    if (!confirm(`Delete account "${accountName}"? This cannot be undone.`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName }),
    });
    loadUsers();
  }
  async function deleteGroup(id: string) {
    if (!confirm("Delete this group and all its messages?")) return;
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    loadGroups();
  }
  async function deleteGame(id: string) {
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    loadGames();
  }
  async function openDM(conv: DMConv) {
    setViewingDM(conv);
    setDmMsgs(await fetch(`/api/admin/dms/${conv.key}`).then((r) => r.json()));
  }

  const tabBtn = (id: typeof tab, label: string) => (
    <div
      onClick={() => setTab(id)}
      className={`px-3.5 py-1.5 rounded-md text-sm cursor-pointer border ${
        tab === id ? "bg-violet text-white border-violet" : "bg-bg2 text-txt1 border-line"
      }`}
    >
      {label}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold text-gold">Admin</h2>
      </div>
      <div className="flex gap-2 px-5 pt-3.5">
        {tabBtn("users", "Users")}
        {tabBtn("groups", "Groups")}
        {tabBtn("dms", "DMs")}
        {tabBtn("games", "Games")}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "users" && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                <th className="py-2 px-2">Display name</th>
                <th className="py-2 px-2 font-mono">Account</th>
                <th className="py-2 px-2">Role</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.account_name} className="border-b border-line text-txt1">
                  <td className="py-2 px-2">{u.display_name}</td>
                  <td className="py-2 px-2 font-mono">{u.account_name}</td>
                  <td className="py-2 px-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.is_admin ? "bg-gold/15 text-gold" : "bg-bg3"}`}>
                      {u.is_admin ? "admin" : "member"}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {u.account_name !== me ? (
                      <>
                        <button
                          onClick={() => toggleAdmin(u.account_name, u.is_admin)}
                          className="bg-bg3 border border-line rounded px-2 py-1 text-xs mr-1.5"
                        >
                          {u.is_admin ? "Revoke admin" : "Make admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(u.account_name)}
                          className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-txt2">— you —</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "groups" &&
          (groups.length === 0 ? (
            <Empty text="No groups yet" />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                  <th className="py-2 px-2">Group</th>
                  <th className="py-2 px-2">Members</th>
                  <th className="py-2 px-2 font-mono">Created by</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-line text-txt1">
                    <td className="py-2 px-2">{g.name}</td>
                    <td className="py-2 px-2">{g.memberCount}</td>
                    <td className="py-2 px-2 font-mono">{g.created_by}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => deleteGroup(g.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "dms" &&
          (viewingDM ? (
            <div>
              <button onClick={() => setViewingDM(null)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs mb-3">
                ← back
              </button>
              <div className="text-sm text-txt2 mb-3">
                {viewingDM.accountA} ↔ {viewingDM.accountB}
              </div>
              {dmMsgs.length === 0 ? (
                <Empty text="No messages" />
              ) : (
                dmMsgs.map((m) => (
                  <div key={m.id} className="py-1.5">
                    <div className="text-xs text-txt2">
                      <span className="font-semibold text-txt0">{m.display_name}</span>{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                ))
              )}
            </div>
          ) : dms.length === 0 ? (
            <Empty text="No DMs yet" />
          ) : (
            <>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                    <th className="py-2 px-2">Conversation</th>
                    <th className="py-2 px-2"></th>
                    <th className="py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dms.map((d) => (
                    <tr key={d.key} className="border-b border-line text-txt1">
                      <td className="py-2 px-2 font-mono">
                        {d.accountA} ↔ {d.accountB}
                      </td>
                      <td className="py-2 px-2">{d.messageCount} messages</td>
                      <td className="py-2 px-2">
                        <button onClick={() => openDM(d)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[11px] text-txt2 mt-3">
                Admins can view all private conversations for moderation purposes. Use responsibly.
              </div>
            </>
          ))}

        {tab === "games" &&
          (games.length === 0 ? (
            <Empty text="No games yet" />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                  <th className="py-2 px-2">Game</th>
                  <th className="py-2 px-2 font-mono">Added by</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-line text-txt1">
                    <td className="py-2 px-2">{g.name}</td>
                    <td className="py-2 px-2 font-mono">{g.added_by}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => deleteGame(g.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center text-txt2 mt-10">
      <div className="text-sm text-txt1">{text}</div>
    </div>
  );
}
