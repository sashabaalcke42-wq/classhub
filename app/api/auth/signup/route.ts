import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const { accountName, displayName, password } = await req.json();

  if (!accountName || !displayName || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const clean = String(accountName).trim().toLowerCase();
  const display = String(displayName).trim();

  if (!/^[a-z0-9_.]{3,20}$/.test(clean)) {
    return NextResponse.json(
      { error: "Account name must be 3-20 chars: lowercase letters, numbers, _ or ." },
      { status: 400 }
    );
  }
  if (display.length < 1 || display.length > 30) {
    return NextResponse.json({ error: "Display name must be 1-30 characters" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  try {
    // First account created on the whole site becomes admin.
    const { count, error: countError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { error: "DEBUG count query failed: " + countError.message, code: countError.code },
        { status: 500 }
      );
    }
    const isFirst = (count ?? 0) === 0;

    const password_hash = await hashPassword(password);

    const { error } = await supabaseAdmin.from("users").insert({
      account_name: clean,
      display_name: display,
      password_hash,
      is_admin: isFirst,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That account name is taken" }, { status: 409 });
      }
      return NextResponse.json(
        { error: "DEBUG insert failed: " + error.message, code: error.code },
        { status: 500 }
      );
    }

    await createSession({ accountName: clean, displayName: display, isAdmin: isFirst });
    return NextResponse.json({ ok: true, isAdmin: isFirst });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DEBUG unexpected exception: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}