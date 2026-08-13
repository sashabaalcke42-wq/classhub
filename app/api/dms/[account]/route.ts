import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession, destroySession } from "@/lib/session";

function dmKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

export async function GET(_req: Request, { params }: { params: Promise<{ account: string }> }) {
  const { account } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const other = account.toLowerCase();
  const key = dmKey(session.accountName, other);

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("scope", "dm")
    .eq("dm_key", key)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ account: string }> }) {
  const { account } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userExists } = await supabaseAdmin
    .from("users")
    .select("account_name")
    .eq("account_name", session.accountName)
    .maybeSingle();
  if (!userExists) {
    await destroySession();
    return NextResponse.json(
      { error: "Your session is out of date — please log in again." },
      { status: 401 }
    );
  }

  const other = account.toLowerCase();
  const { body } = await req.json();
  const text = String(body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const key = dmKey(session.accountName, other);

  const { data: sender } = await supabaseAdmin
    .from("users")
    .select("avatar_path")
    .eq("account_name", session.accountName)
    .maybeSingle();

  let insertRow: Record<string, any> = {
    scope: "dm",
    dm_key: key,
    from_account: session.accountName,
    display_name: session.displayName,
    is_admin: session.isAdmin,
    avatar_path: sender?.avatar_path ?? null,
    body: text,
  };

  if (text.startsWith("/poll ")) {
    const parts = text.slice(6).split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const [question, ...options] = parts;
      insertRow = { ...insertRow, message_type: "poll", poll_question: question, poll_options: options.slice(0, 6), body: question };
    } else {
      return NextResponse.json(
        { error: "Poll format: /poll Question | Option A | Option B (at least 2 options)" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin.from("messages").insert(insertRow).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
