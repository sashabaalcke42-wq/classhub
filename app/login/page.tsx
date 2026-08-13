"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [accountName, setAccountName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login" ? { accountName, password } : { accountName, displayName, password, classCode };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(124,92,252,.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,217,192,.12), transparent 40%)" }} />
      <form onSubmit={submit} className="relative w-[380px] bg-bg1 border border-line rounded-xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-[3px]" style={{ background: "linear-gradient(135deg,#7c5cfc,#00d9c0)" }} />
          <span className="font-display text-2xl font-bold">ClassHub</span>
        </div>
        <p className="text-txt2 text-sm mb-6">
          {mode === "login" ? "Sign in to your class account" : "Create your class account"}
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        <Field label="Account name">
          <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
            className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
            placeholder="e.g. jsmith" />
        </Field>

        {mode === "signup" && (
          <Field label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
              placeholder="What others see in chat" />
          </Field>
        )}

        <Field label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
            placeholder="••••••••" />
        </Field>

        {mode === "signup" && (
          <Field label="Class code">
            <input value={classCode} onChange={(e) => setClassCode(e.target.value)}
              className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
              placeholder="Ask your teacher for this" />
          </Field>
        )}

        <button disabled={loading} className="w-full bg-violet hover:bg-[#8b6dff] transition-colors text-white rounded-md py-2.5 font-semibold text-sm">
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <div className="text-center mt-4 text-sm text-txt2">
          {mode === "login" ? (
            <>No account? <a className="text-teal cursor-pointer" onClick={() => setMode("signup")}>Create one</a></>
          ) : (
            <>Already have an account? <a className="text-teal cursor-pointer" onClick={() => setMode("login")}>Sign in</a></>
          )}
        </div>

        <div className="text-[11px] text-txt2 mt-4 pt-3 border-t border-line leading-relaxed">
          The very first account created on this site becomes the admin.
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs uppercase tracking-wide text-txt1 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
