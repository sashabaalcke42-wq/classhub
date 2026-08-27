"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderWidgets from "@/components/HeaderWidgets";

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<string[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends);
      setRequests(data.requests);
      setOutgoing(data.outgoing ?? []);
    }
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
  }, []);

  async function cancelRequest(toAccount: string) {
    await fetch("/api/friends/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAccount }),
    });
    load();
  }

  async function removeFriend(accountName: string) {
    if (!confirm(`Remove ${accountName} as a friend?`)) return;
    await fetch("/api/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName }),
    });
    load();
  }

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
        <HeaderWidgets />
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
              Add someone by their account name above, or browse the Directory.
            </div>
          ) : (
            friends.map((f) => (
              <div key={f} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-bg2 text-sm">
                <span className="cursor-pointer" onClick={() => router.push(`/dashboard/dm/${f}`)}>{f}</span>
                <span className="flex gap-2">
                  <span className="bg-bg3 border border-line rounded px-2 py-1 text-xs cursor-pointer" onClick={() => router.push(`/dashboard/dm/${f}`)}>Message</span>
                  <button onClick={() => removeFriend(f)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">Remove</button>
                </span>
              </div>
            ))
          )}

          {outgoing.length > 0 && (
            <>
              <h4 className="text-xs uppercase tracking-wide text-txt2 mt-6 mb-2">Outgoing requests</h4>
              {outgoing.map((o) => (
                <div key={o} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-bg2 text-sm">
                  <span>{o}</span>
                  <button onClick={() => cancelRequest(o)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs">Cancel</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
