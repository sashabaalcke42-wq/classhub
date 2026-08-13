import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!session.isAdmin) return { error: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("users")
    .select("account_name, display_name, is_admin, credits, banned_until, ban_reason, created_at")
    .order("created_at", { ascending: true });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { accountName, isAdmin, credits } = await req.json();
  const updates: Record<string, any> = {};

  if (isAdmin !== undefined) {
    if (accountName === session!.accountName) {
      return NextResponse.json({ error: "You can't change your own admin status" }, { status: 400 });
    }
    updates.is_admin = !!isAdmin;
  }
  if (credits !== undefined) {
    updates.credits = Math.max(0, parseInt(credits, 10) || 0);
  }

  const { error: dbErr } = await supabaseAdmin.from("users").update(updates).eq("account_name", accountName);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  if (isAdmin !== undefined) await logActivity(session!.accountName, isAdmin ? "make_admin" : "revoke_admin", accountName, null);
  if (credits !== undefined) await logActivity(session!.accountName, "coins_changed", accountName, `set to ${updates.credits}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { accountName } = await req.json();
  if (accountName === session!.accountName) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const { error: dbErr } = await supabaseAdmin.from("users").delete().eq("account_name", accountName);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  await logActivity(session!.accountName, "delete_account", accountName, null);
  return NextResponse.json({ ok: true });
}
