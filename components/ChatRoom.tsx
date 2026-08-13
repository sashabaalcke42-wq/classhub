"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Msg = {
  id: string;
  from_account: string;
  display_name: string;
  is_admin: boolean;
  body: string;
  created_at: string;
  scope: string;
  group_id: string | null;
};

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
}: {
  title: string;
  scope: "global" | "group";
  groupId?: string;
  me: { accountName: string; isAdmin: boolean };
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const query = scope === "global" ? "scope=global" : `scope=group&groupId=${groupId}`;

  async function load() {
    const res = await fetch(`/api/messages?${query}`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    // Realtime: instantly reflect new/removed messages for this scope.
    const channel = supabaseBrowser
      .channel(`messages-${scope}-${groupId ?? "global"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Msg;
          if (row.scope !== scope) return;
          if (scope === "group" && row.group_id !== groupId) return;
          load();
        }
      )
      .subscribe();

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
    setInput("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, groupId, body: text }),
    });
    if (res.ok) {
      const newMsg: Msg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
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

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-2.5 bg-bg1">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <div className="ml-auto flex items-center gap-3">
          {me.isAdmin && (
            <>
              {selectMode && selected.size > 0 && (
                <button onClick={deleteSelected} className="bg-danger text-white rounded-md px-3 py-1.5 text-xs font-semibold">
                  Delete {selected.size} selected
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-txt2">
            <div className="text-sm text-txt1 mb-1">No messages yet</div>
            Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const canDelete = me.isAdmin || m.from_account === me.accountName;
            return (
              <div key={m.id} className={`flex gap-2.5 px-1 py-1.5 rounded-md hover:bg-bg1 group ${selectMode && selected.has(m.id) ? "bg-violet/10" : ""}`}>
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSelected(m.id)}
                    className="mt-2 flex-shrink-0"
                  />
                )}
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: colorFor(m.from_account) + "22", color: colorFor(m.from_account) }}
                >
                  {initials(m.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold text-sm ${m.is_admin ? "text-gold" : ""}`}>{m.display_name}</span>
                    <span className="font-mono text-[11px] text-txt2">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {canDelete && (
                      <button
                        className="ml-auto text-[11px] text-txt2 opacity-0 group-hover:opacity-100 hover:text-danger"
                        onClick={() => remove(m.id)}
                      >
                        delete
                      </button>
                    )}
                  </div>
                  <div className="text-sm break-words">{m.body}</div>
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
            placeholder="Message..."
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
