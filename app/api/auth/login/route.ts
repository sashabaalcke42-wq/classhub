import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const { accountName, password } = await req.json();
  if (!accountName || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const clean = String(accountName).trim().toLowerCase();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("account_name", clean)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Incorrect account name or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect account name or password" }, { status: 401 });
  }

  await createSession({
    accountName: user.account_name,
    displayName: user.display_name,
    isAdmin: user.is_admin,
  });

  return NextResponse.json({ ok: true, isAdmin: user.is_admin });
}
