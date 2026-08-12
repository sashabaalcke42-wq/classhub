"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { account_name: string; users: { display_name: string } };

export default function GroupSidebar({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/groups/${groupId}/members`);
    if (res.ok) setMembers(await res.json());
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

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

  async function leaveGroup() {
    if (!confirm(`Leave "${groupName}"?`)) return;
    await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
    router.push("/dashboard");
  }

  return (
    <div className="w-[220px] bg-bg1 border-l border-line p-3 flex flex-col">
      <h4 className="text-[11px] uppercase tracking-wide text-txt2 mb-2">Members — {members.length}</h4>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {members.map((m) => (
          <div key={m.account_name} className="text-sm text-txt1 px-2 py-1.5 rounded-md hover:bg-bg2">
            {m.users?.display_name ?? m.account_name}
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
