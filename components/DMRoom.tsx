"use client";

import { useEffect, useRef, useState } from "react";
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

export default function DMRoom({
  otherAccount,
  otherDisplay,
  me,
}: {
  otherAccount: string;
  otherDisplay: string;
  me: { accountName: string; isAdmin: boolean };
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastConfettiSeen = useRef<number>(Date.now());

  async function load() {
    const res = await fetch(`/api/dms/${otherAccount}`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);

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
  }, [otherAccount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (text === "/confetti") {
      setInput("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      // DMs poll rather than use realtime broadcast, so let the other
      // person's next poll pick this up via a lightweight marker message.
      await fetch(`/api/dms/${otherAccount}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "🎉" }),
      });
      load();
      return;
    }

    setInput("");
    const res = await fetch(`/api/dms/${otherAccount}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const newMsg: Msg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to send");
    }
  }

  async function togglePin(id: string) {
    await fetch(`/api/messages/${id}/pin`, { method: "POST" });
    load();
  }

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {showConfetti && <ConfettiBurst />}

      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-2.5 bg-bg1">
        <h2 className="font-display text-lg font-bold">DM · {otherDisplay}</h2>
        {pinnedMessages.length > 0 && (
          <button onClick={() => setShowPinned((s) => !s)} className="text-xs text-gold flex items-center gap-1">
            📌 {pinnedMessages.length} pinned
          </button>
        )}
        <HeaderWidgets />
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
            Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const url = avatarUrl(m.avatar_path);
            return (
              <div key={m.id} className={`flex gap-2.5 px-1 py-1.5 rounded-md hover:bg-bg1 group ${m.pinned ? "border-l-2 border-gold pl-2" : ""}`}>
                <div className="w-[34px] h-[34px] rounded-full bg-bg3 flex items-center justify-center text-xs font-bold text-txt1 flex-shrink-0 overflow-hidden">
                  {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initials(m.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold text-sm ${m.is_admin ? "text-gold" : ""}`}>{m.display_name}</span>
                    <span className="font-mono text-[11px] text-txt2">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      className="ml-auto text-[11px] text-txt2 hover:text-gold opacity-0 group-hover:opacity-100"
                      onClick={() => togglePin(m.id)}
                    >
                      {m.pinned ? "unpin" : "pin"}
                    </button>
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
