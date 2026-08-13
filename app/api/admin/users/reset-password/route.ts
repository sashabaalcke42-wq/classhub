import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activityLog";

function randomPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { accountName } = await req.json();
  const tempPassword = randomPassword();
  const password_hash = await hashPassword(tempPassword);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash })
    .eq("account_name", accountName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(session.accountName, "password_reset", accountName, null);
  return NextResponse.json({ ok: true, tempPassword });
}
