import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("password_hash")
    .eq("account_name", session.accountName)
    .single();
  if (error || !user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const password_hash = await hashPassword(newPassword);
  const { error: updateErr } = await supabaseAdmin
    .from("users")
    .update({ password_hash })
    .eq("account_name", session.accountName);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
