import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession, createSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("account_name, display_name, bio, avatar_path, credits, is_admin, created_at")
    .eq("account_name", session.accountName)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { displayName, bio } = await req.json();
  const updates: Record<string, string> = {};

  if (displayName !== undefined) {
    const clean = String(displayName).trim();
    if (clean.length < 1 || clean.length > 30) {
      return NextResponse.json({ error: "Display name must be 1-30 characters" }, { status: 400 });
    }
    updates.display_name = clean;
  }
  if (bio !== undefined) {
    updates.bio = String(bio).slice(0, 300);
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("account_name", session.accountName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Refresh the session cookie if display name changed, so chat/UI reflect it immediately.
  if (updates.display_name) {
    await createSession({
      accountName: session.accountName,
      displayName: updates.display_name,
      isAdmin: session.isAdmin,
    });
  }

  return NextResponse.json({ ok: true });
}
