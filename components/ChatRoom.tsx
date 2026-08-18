"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ConfettiBurst from "./ConfettiBurst";
import PollMessage from "./PollMessage";
import HeaderWidgets from "./HeaderWidgets";

type Msg = {
  id: string;
  from_account: string;
  display_name: string;
  is_admin: boolean;
  avatar_path: string | null;
  body: string;
  created_at: string;
  scope: string;
  group_id: string | null;
  pinned: boolean;
  message_type: "text" | "poll";
  poll_question: string | null;
  poll_options: string[] | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
function avatarUrl(path: string | null) {
  return path ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
}
function initials(name: string) {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}
function colorFor(seed: string) {
  const colors = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];
  let h = 0;
  for (const c of seed || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export default function ChatRoom({
  title,
  scope,
  groupId,
  me,
  canPin,
}: {
  title: string;
  scope: "global" | "group";
  groupId?: string;
  me: { accountName: string; isAdmin: boolean };
  canPin?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  const query = scope === "global" ? "scope=global" : `scope=group&groupId=${groupId}`;

  async function load() {
    const res = await fetch(`/api/messages?${query}`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const channel = supabaseBrowser
      .channel(`messages-${scope}-${groupId ?? "global"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = (payload.new ?? payload.old) as Msg;
        if (row.scope !== scope) return;
        if (scope === "group" && row.group_id !== groupId) return;
        load();
      })
      .on("broadcast", { event: "confetti" }, () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (text === "/confetti") {
      setInput("");
      channelRef.current?.send({ type: "broadcast", event: "confetti", payload: {} });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      return;
    }

    setInput("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, groupId, body: text }),
    });
    if (res.ok) {
      const newMsg: Msg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to send");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePin(id: string) {
    await fetch(`/api/messages/${id}/pin`, { method: "POST" });
    load();
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected message${selected.size > 1 ? "s" : ""}?`)) return;
    await fetch("/api/admin/messages/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    setSelectMode(false);
    load();
  }

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {showConfetti && <ConfettiBurst />}

      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-2.5 bg-bg1">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {pinnedMessages.length > 0 && (
          <button onClick={() => setShowPinned((s) => !s)} className="text-xs text-gold flex items-center gap-1">
            📌 {pinnedMessages.length} pinned
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          {me.isAdmin && (
            <>
              {selectMode && selected.size > 0 && (
                <button onClick={deleteSelected} className="bg-danger text-white rounded-md px-3 py-1.5 text-xs font-semibold">
                  Delete {selected.size} selected
                </button>
              )}
              {selectMode && (
                <button
                  onClick={() => setSelected(new Set(messages.map((m) => m.id)))}
                  className="text-xs px-3 py-1.5 rounded-md border bg-bg2 border-line text-txt1"
                >
                  Select all
                </button>
              )}
              <button
                onClick={() => { setSelectMode((s) => !s); setSelected(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-md border ${selectMode ? "bg-violet text-white border-violet" : "bg-bg2 border-line text-txt1"}`}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
            </>
          )}
          <div className="flex items-center gap-1.5 text-xs text-txt2">
            <span className="w-[7px] h-[7px] rounded-full bg-online animate-pulse" /> live
          </div>
          <HeaderWidgets pushRight={false} />
        </div>
      </div>

      {showPinned && pinnedMessages.length > 0 && (
        <div className="bg-gold/5 border-b border-gold/20 px-5 py-2 max-h-[140px] overflow-y-auto">
          {pinnedMessages.map((m) => (
            <div key={m.id} className="text-xs text-txt1 py-1 flex items-center gap-2">
              <span className="text-gold">📌</span>
              <span className="font-semibold">{m.display_name}:</span>
              <span className="text-txt2 truncate">{m.body}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-txt2">
            <div className="text-sm text-txt1 mb-1">No messages yet</div>
            Say hi 👋 (try <span className="font-mono">/poll</span> or <span className="font-mono">/confetti</span>)
          </div>
        ) : (
          messages.map((m) => {
            const canDelete = me.isAdmin || m.from_account === me.accountName;
            const url = avatarUrl(m.avatar_path);
            return (
              <div
                key={m.id}
                onClick={() => selectMode && toggleSelected(m.id)}
                className={`flex gap-2.5 px-1 py-1.5 rounded-md hover:bg-bg1 group ${selectMode ? "cursor-pointer" : ""} ${selectMode && selected.has(m.id) ? "bg-violet/10" : ""} ${m.pinned ? "border-l-2 border-gold pl-2" : ""}`}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSelected(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 flex-shrink-0"
                  />
                )}
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{ background: colorFor(m.from_account) + "22", color: colorFor(m.from_account) }}
                >
                  {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initials(m.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold text-sm ${m.is_admin ? "text-gold" : ""}`}>{m.display_name}</span>
                    <span className="font-mono text-[11px] text-txt2">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100">
                      {canPin && (
                        <button className="text-[11px] text-txt2 hover:text-gold" onClick={(e) => { e.stopPropagation(); togglePin(m.id); }}>
                          {m.pinned ? "unpin" : "pin"}
                        </button>
                      )}
                      {canDelete && (
                        <button className="text-[11px] text-txt2 hover:text-danger" onClick={(e) => { e.stopPropagation(); remove(m.id); }}>
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                  {m.message_type === "poll" ? (
                    <PollMessage messageId={m.id} question={m.poll_question ?? ""} options={m.poll_options ?? []} me={me.accountName} />
                  ) : (
                    <div className="text-sm break-words">{m.body}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 pb-[18px] pt-3.5">
        <form onSubmit={send} className="flex gap-2.5 bg-bg2 border border-line rounded-xl pl-3.5 pr-1.5 py-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message... (try /poll Q | A | B or /confetti)"
            className="flex-1 bg-transparent border-none outline-none text-sm py-2"
          />
          <button type="submit" className="bg-violet text-white rounded-lg px-4 py-2 text-sm font-semibold">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
