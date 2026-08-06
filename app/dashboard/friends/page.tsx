"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<string[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends);
      setRequests(data.requests);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendRequest() {
    setMsg("");
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName: target }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error);
    else {
      setMsg("Request sent.");
      setTarget("");
    }
  }

  async function respond(from: string, accept: boolean) {
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccount: from, accept }),
    });
    load();
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold">Friends</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-[520px]">
          <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">Add by account name</label>
          <div className="flex gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="account name"
              className="flex-1 bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
            />
            <button onClick={sendRequest} className="bg-violet text-white rounded-md px-4 text-sm font-semibold">
              Send request
            </button>
          </div>
          {msg && <div className="text-xs text-txt2 mt-2">{msg}</div>}

          {requests.length > 0 && (
            <>
              <h4 className="text-xs uppercase tracking-wide text-txt2 mt-6 mb-2">Incoming requests</h4>
              {requests.map((r) => (
                <div key={r} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-bg2 text-sm">
                  <span>{r}</span>
                  <span className="flex gap-2">
                    <button onClick={() => respond(r, true)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs">Accept</button>
                    <button onClick={() => respond(r, false)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">Decline</button>
                  </span>
                </div>
              ))}
            </>
          )}

          <h4 className="text-xs uppercase tracking-wide text-txt2 mt-6 mb-2">Your friends</h4>
          {friends.length === 0 ? (
            <div className="text-center text-txt2 py-6">
              <div className="text-sm text-txt1 mb-1">No friends yet</div>
              Add someone by their account name above.
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f}
                className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-bg2 text-sm cursor-pointer"
                onClick={() => router.push(`/dashboard/dm/${f}`)}
              >
                <span>{f}</span>
                <span className="bg-bg3 border border-line rounded px-2 py-1 text-xs">Message</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
