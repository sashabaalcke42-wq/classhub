"use client";

import { useEffect, useState } from "react";

type Vote = { account_name: string; option_index: number };

export default function PollMessage({
  messageId,
  question,
  options,
  me,
}: {
  messageId: string;
  question: string;
  options: string[];
  me: string;
}) {
  const [votes, setVotes] = useState<Vote[]>([]);

  async function load() {
    const res = await fetch(`/api/messages/${messageId}/vote`);
    if (res.ok) setVotes(await res.json());
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  async function vote(optionIndex: number) {
    await fetch(`/api/messages/${messageId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIndex }),
    });
    load();
  }

  const myVote = votes.find((v) => v.account_name === me)?.option_index;
  const total = votes.length;

  return (
    <div className="mt-1 bg-bg2 border border-line rounded-lg p-3 max-w-[320px]">
      <div className="text-sm font-semibold mb-2">📊 {question}</div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => {
          const count = votes.filter((v) => v.option_index === i).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const mine = myVote === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              className={`relative text-left text-xs rounded-md px-2.5 py-1.5 overflow-hidden border ${mine ? "border-violet" : "border-line"}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-violet/20"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex justify-between">
                <span>{mine ? "✓ " : ""}{opt}</span>
                <span className="text-txt2">{count} · {pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-txt2 mt-2">{total} vote{total !== 1 ? "s" : ""}</div>
    </div>
  );
}
