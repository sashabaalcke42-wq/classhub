"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  from_account: string;
  display_name: string;
  is_admin: boolean;
  body: string;
  created_at: string;
};

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
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/dms/${otherAccount}`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherAccount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await fetch(`/api/dms/${otherAccount}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    load();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-2.5 bg-bg1">
        <h2 className="font-display text-lg font-bold">DM · {otherDisplay}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-txt2">
            <div className="text-sm text-txt1 mb-1">No messages yet</div>
            Say hi 👋
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-2.5 px-1 py-1.5 rounded-md hover:bg-bg1">
              <div className="w-[34px] h-[34px] rounded-full bg-bg3 flex items-center justify-center text-xs font-bold text-txt1 flex-shrink-0">
                {initials(m.display_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`font-semibold text-sm ${m.is_admin ? "text-gold" : ""}`}>{m.display_name}</span>
                  <span className="font-mono text-[11px] text-txt2">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-sm break-words">{m.body}</div>
              </div>
            </div>
          ))
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
