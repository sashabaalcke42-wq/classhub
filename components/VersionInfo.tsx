"use client";

import { useEffect, useState } from "react";

export const APP_VERSION = "9.0.0";

const CHANGELOG: { version: string; items: string[] }[] = [
  { version: "9.0.0", items: [
    "Maintenance mode — locks the dashboard to admins only while you're doing migrations or major updates",
    "Site-wide dismissible announcement banner, set from Admin \u2192 Settings",
    "Custom site name shown in the browser tab title",
  ]},
  { version: "8.0.3", items: [
    "Fixed slow game loading — the file server was querying the database on every single file a game needs (HTML, JS, each asset) for a lookup that was always predictable, adding real delay for games split across multiple small files",
    "Games now cache for 24 hours (up from 1) with a 7-day stale-while-revalidate window, so repeat plays load instantly",
  ]},
  { version: "8.0.2", items: [
    "Fixed: rail and top bar scrolling away instead of staying fixed (missing min-h-0 on nested flex layout)",
    "Notifications/coins now merged directly into each page's existing header bar instead of a separate floating overlay — no more double bars, no more overlapping buttons",
  ]},
  { version: "8.0.0", items: [
    "Notifications: bell icon + coin counter now live in a top bar on every page",
    "In-app notifications for: friend requests (sent/accepted), new DMs, game submissions (to admins), game review results, new quizzes, quiz grading, suggestion status changes, and coins received",
    "Desktop notifications — a Profile toggle that pops real browser notifications for new alerts",
  ]},
  { version: "7.1.0", items: [
    "Banner images — drop a banner.png in a game's zip root and it becomes the cover art automatically",
    "Clicking a game (Arcade, Store, or Library) now opens a Steam-style detail sidebar with description, stats, and a Play/Buy button, instead of jumping straight in",
    "Arcade detail panel shows your best score, total plays, and achievement progress for that game",
  ]},
  { version: "7.0.0", items: [
    "Community Suggestions tab (this!) — submit and upvote ideas for future versions",
    "Coin reward is now set per-quiz by the admin, instead of a fixed amount for every quiz",
    "Remove a game from your Library anytime",
    "Fixed: students who upload a game no longer have to buy their own creation — approval grants it free",
  ]},
  { version: "6.1.0", items: [
    "Version info button (this whole panel)",
    "Bulk delete: Select all + click-anywhere-on-message to select",
    "Global chat auto-trims to the most recent 200 messages",
    "Only admins can create polls in Global chat (groups/DMs still open to everyone)",
    "Arcade now credits your progress even if you leave mid-game, not just on a clean game over",
  ]},
  { version: "6.0.0", items: [
    "Avatars shown in chat bubbles (global/group/DM)",
    "Pin messages (admin in Global, group admins in Groups, either side in DMs)",
    "Full group management: rename, promote/demote admins, remove members",
    "/poll chat command with live voting",
    "/confetti chat command",
    "Coin transfers between accounts",
    "Creator payouts on Store game sales",
  ]},
  { version: "5.0.0", items: [
    "Signup class code, changeable live from Admin \u2192 Settings, no redeploy needed",
  ]},
  { version: "4.0.0", items: [
    "Admin: password reset, ban/unban (temp or permanent), force logout",
    "Full admin activity log",
    "Bulk message delete",
  ]},
  { version: "3.1.0", items: [
    "Arcade scoring contract (postMessage) with coins-per-point, cooldowns, daily caps",
    "Per-game achievements",
    "Admin can preview unpublished Store submissions safely before approving",
    "Admin can set a Store game's price at upload time",
  ]},
  { version: "3.0.0", items: [
    "Store: submit, review queue, approve/reject/needs-changes, purchase with coins",
    "Library: play owned games",
  ]},
  { version: "2.0.0", items: [
    "Quiz system: true/false, multiple choice, written (admin-graded)",
    "Scheduled release/close times, archive vs. permanent delete",
    "Quiz leaderboard, coin rewards for correct answers",
  ]},
  { version: "1.0.0", items: [
    "Profile: avatar upload, bio, display name, password change",
    "Starting coin balance for every account",
    "Directory with search, Friends with block/pending, Leaderboards",
  ]},
];

type Suggestion = {
  id: string; display_name: string; title: string; body: string | null;
  status: "open" | "planned" | "done" | "declined"; votes: number; votedByMe: boolean; created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-bg3 text-txt2",
  planned: "bg-violet/15 text-violet",
  done: "bg-online/15 text-online",
  declined: "bg-danger/15 text-danger",
};

export default function VersionInfo({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"changelog" | "suggestions">("changelog");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  async function loadSuggestions() {
    setSuggestions(await fetch("/api/suggestions").then((r) => r.json()));
  }
  useEffect(() => {
    if (open && tab === "suggestions") loadSuggestions();
  }, [open, tab]);

  async function vote(id: string) {
    await fetch(`/api/suggestions/${id}/vote`, { method: "POST" });
    loadSuggestions();
  }
  async function submitSuggestion() {
    if (!newTitle.trim()) return;
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, body: newBody }),
    });
    setNewTitle("");
    setNewBody("");
    setShowNew(false);
    loadSuggestions();
  }
  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadSuggestions();
  }
  async function removeSuggestion(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    await fetch(`/api/admin/suggestions/${id}`, { method: "DELETE" });
    loadSuggestions();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[10px] text-txt2 hover:text-txt0 font-mono px-1" title="Version info">
        v{APP_VERSION}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80]" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-bg1 border border-line rounded-xl p-6 w-[460px] max-h-[80vh] flex flex-col">
            <h3 className="font-display text-lg font-bold mb-1">ClassHub</h3>
            <div className="text-xs text-gold font-mono mb-3">Current version: {APP_VERSION}</div>

            <div className="flex gap-2 mb-3">
              <button onClick={() => setTab("changelog")} className={`text-xs px-3 py-1.5 rounded-md border ${tab === "changelog" ? "bg-violet text-white border-violet" : "bg-bg2 border-line text-txt1"}`}>Changelog</button>
              <button onClick={() => setTab("suggestions")} className={`text-xs px-3 py-1.5 rounded-md border ${tab === "suggestions" ? "bg-violet text-white border-violet" : "bg-bg2 border-line text-txt1"}`}>Suggestions</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "changelog" && (
                <div className="flex flex-col gap-4">
                  {CHANGELOG.map((entry) => (
                    <div key={entry.version}>
                      <div className="text-sm font-semibold font-mono mb-1.5">{entry.version}</div>
                      <ul className="text-xs text-txt2 flex flex-col gap-1 list-disc pl-4">
                        {entry.items.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {tab === "suggestions" && (
                <div>
                  <button onClick={() => setShowNew((s) => !s)} className="text-xs text-violet mb-3">
                    {showNew ? "Cancel" : "+ Suggest something"}
                  </button>
                  {showNew && (
                    <div className="bg-bg2 border border-line rounded-lg p-3 mb-3">
                      <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Short title" maxLength={100}
                        className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm mb-2" />
                      <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Details (optional)" rows={2}
                        className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm mb-2 resize-none" />
                      <button onClick={submitSuggestion} className="bg-violet text-white rounded-md px-3 py-1.5 text-xs font-semibold">Submit</button>
                    </div>
                  )}

                  {suggestions.length === 0 ? (
                    <div className="text-xs text-txt2 text-center mt-6">No suggestions yet — be the first!</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {suggestions.map((s) => (
                        <div key={s.id} className="bg-bg2 border border-line rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <button onClick={() => vote(s.id)} className={`flex flex-col items-center px-2 py-1 rounded-md border flex-shrink-0 ${s.votedByMe ? "border-violet text-violet" : "border-line text-txt2"}`}>
                              <span className="text-xs">▲</span>
                              <span className="text-[11px] font-semibold">{s.votes}</span>
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{s.title}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                              </div>
                              {s.body && <div className="text-xs text-txt2 mt-1">{s.body}</div>}
                              <div className="text-[10px] text-txt2 mt-1">by {s.display_name}</div>
                              {isAdmin && (
                                <div className="flex gap-1.5 mt-2">
                                  {["open", "planned", "done", "declined"].filter((x) => x !== s.status).map((st) => (
                                    <button key={st} onClick={() => setStatus(s.id, st)} className="text-[10px] bg-bg3 border border-line rounded px-1.5 py-0.5">{st}</button>
                                  ))}
                                  <button onClick={() => removeSuggestion(s.id)} className="text-[10px] text-danger">delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setOpen(false)} className="mt-4 w-full bg-bg2 border border-line rounded-md py-2 text-sm">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
