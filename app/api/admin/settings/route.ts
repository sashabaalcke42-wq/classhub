import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabaseAdmin.from("app_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value ?? "";
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { signupCode } = await req.json();
  if (signupCode !== undefined) {
    const clean = String(signupCode).trim();
    if (clean.length < 4) {
      return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "signup_code", value: clean });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logActivity(session.accountName, "signup_code_changed", null, null);
  }

  return NextResponse.json({ ok: true });
}
