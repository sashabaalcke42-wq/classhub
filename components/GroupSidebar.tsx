"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { account_name: string; role: "member" | "admin"; users: { display_name: string } };

export default function GroupSidebar({
  groupId,
  groupName,
  me,
}: {
  groupId: string;
  groupName: string;
  me: { accountName: string; isAdmin: boolean };
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState("");
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(groupName);

  async function load() {
    const res = await fetch(`/api/groups/${groupId}/members`);
    if (res.ok) setMembers(await res.json());
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const myRole = members.find((m) => m.account_name === me.accountName)?.role;
  const isGroupAdmin = me.isAdmin || myRole === "admin";

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName: newMember.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else {
      setNewMember("");
      load();
    }
  }

  async function removeMember(account: string) {
    if (!confirm(`Remove ${account} from the group?`)) return;
    const res = await fetch(`/api/groups/${groupId}/members/${account}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json()).error);
    load();
  }

  async function toggleRole(account: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "member" : "admin";
    await fetch(`/api/groups/${groupId}/members/${account}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    load();
  }

  async function saveRename() {
    if (!nameInput.trim()) return;
    const res = await fetch(`/api/groups/${groupId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    if (res.ok) {
      setRenaming(false);
      router.refresh();
    } else alert((await res.json()).error);
  }

  async function leaveGroup() {
    if (!confirm(`Leave "${groupName}"?`)) return;
    await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
    router.push("/dashboard");
  }

  return (
    <div className="w-[240px] bg-bg1 border-l border-line p-3 flex flex-col">
      {renaming ? (
        <div className="mb-3">
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm mb-1.5" />
          <div className="flex gap-1.5">
            <button onClick={saveRename} className="flex-1 bg-violet text-white rounded-md py-1.5 text-xs font-semibold">Save</button>
            <button onClick={() => { setRenaming(false); setNameInput(groupName); }} className="bg-bg2 border border-line rounded-md px-2 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        isGroupAdmin && (
          <button onClick={() => setRenaming(true)} className="text-[11px] text-txt2 hover:text-txt0 mb-2 self-start">✏️ Rename group</button>
        )
      )}

      <h4 className="text-[11px] uppercase tracking-wide text-txt2 mb-2">Members — {members.length}</h4>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {members.map((m) => (
          <div key={m.account_name} className="flex items-center justify-between text-sm text-txt1 px-2 py-1.5 rounded-md hover:bg-bg2 group">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{m.users?.display_name ?? m.account_name}</span>
              {m.role === "admin" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold flex-shrink-0">admin</span>}
            </span>
            {isGroupAdmin && m.account_name !== me.accountName && (
              <span className="hidden group-hover:flex gap-1 flex-shrink-0">
                <button onClick={() => toggleRole(m.account_name, m.role)} className="text-[10px] text-txt2 hover:text-gold">
                  {m.role === "admin" ? "demote" : "promote"}
                </button>
                <button onClick={() => removeMember(m.account_name)} className="text-[10px] text-txt2 hover:text-danger">remove</button>
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={addMember} className="mt-3 pt-3 border-t border-line">
        <label className="block text-[11px] uppercase tracking-wide text-txt2 mb-1.5">Add member</label>
        <div className="flex gap-1.5">
          <input
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="account name"
            className="flex-1 min-w-0 bg-bg2 border border-line rounded-md px-2 py-1.5 text-xs outline-none focus:border-violet"
          />
          <button type="submit" className="bg-violet text-white rounded-md px-2.5 text-xs font-semibold">Add</button>
        </div>
        {error && <div className="text-[11px] text-danger mt-1.5">{error}</div>}
      </form>

      <button onClick={leaveGroup} className="mt-3 bg-bg2 border border-line rounded-md py-1.5 text-xs text-danger hover:bg-danger/10">
        Leave group
      </button>
    </div>
  );
}
