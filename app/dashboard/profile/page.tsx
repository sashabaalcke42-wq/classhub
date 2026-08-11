"use client";

import { useEffect, useRef, useState } from "react";

type Profile = {
  account_name: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  credits: number;
  is_admin: boolean;
  created_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function avatarUrl(path: string | null) {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setDisplayName(data.display_name);
      setBio(data.bio ?? "");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio }),
    });
    const data = await res.json();
    if (!res.ok) setErr(data.error);
    else {
      setMsg("Profile updated.");
      load();
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) setErr(data.error);
    else {
      setMsg("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  async function uploadAvatar() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setErr("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) setErr(data.error);
    else {
      setMsg("Avatar updated.");
      load();
    }
  }

  if (!profile) return <div className="flex-1 flex items-center justify-center text-txt2">Loading...</div>;

  const url = avatarUrl(profile.avatar_path);

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold">Profile</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-[480px] flex flex-col gap-6">
          {err && <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md">{err}</div>}
          {msg && <div className="bg-online/10 border border-online/30 text-online text-sm px-3 py-2 rounded-md">{msg}</div>}

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg3 overflow-hidden flex items-center justify-center text-xl font-bold">
              {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : profile.display_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="text-xs" onChange={uploadAvatar} />
              <div className="text-[11px] text-txt2 mt-1">PNG, JPEG, WEBP, or GIF — under 5MB</div>
            </div>
          </div>

          <div className="text-sm text-txt1">
            <span className="text-txt2">Account:</span> <span className="font-mono">{profile.account_name}</span> ·{" "}
            <span className="text-txt2">Credits:</span> <span className="text-gold font-semibold">{profile.credits}</span>
            {profile.is_admin && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold">admin</span>}
          </div>

          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300}
                className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet resize-none" />
            </div>
            <button type="submit" className="self-start bg-violet text-white rounded-md px-4 py-2 text-sm font-semibold">
              Save profile
            </button>
          </form>

          <form onSubmit={changePassword} className="flex flex-col gap-3 pt-4 border-t border-line">
            <h4 className="text-xs uppercase tracking-wide text-txt2">Change password</h4>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet" />
            <button type="submit" className="self-start bg-bg3 border border-line rounded-md px-4 py-2 text-sm font-semibold">
              Change password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
