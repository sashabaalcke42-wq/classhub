"use client";

import { useState } from "react";

export const APP_VERSION = "6.1.0";

const CHANGELOG: { version: string; items: string[] }[] = [
  { version: "6.1.0", items: [
    "Version info button (this!)",
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

export default function VersionInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-txt2 hover:text-txt0 font-mono px-1"
        title="Version info"
      >
        v{APP_VERSION}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80]" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-bg1 border border-line rounded-xl p-6 w-[420px] max-h-[80vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold mb-1">ClassHub</h3>
            <div className="text-xs text-gold font-mono mb-4">Current version: {APP_VERSION}</div>
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
            <button onClick={() => setOpen(false)} className="mt-5 w-full bg-bg2 border border-line rounded-md py-2 text-sm">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
