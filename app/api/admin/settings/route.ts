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

  const { signupCode, siteName, maintenanceMode, announcement } = await req.json();

  if (signupCode !== undefined) {
    const clean = String(signupCode).trim();
    if (clean.length < 4) {
      return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("app_settings").upsert({ key: "signup_code", value: clean });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logActivity(session.accountName, "signup_code_changed", null, null);
  }

  if (siteName !== undefined) {
    const clean = String(siteName).trim().slice(0, 60) || "ClassHub";
    await supabaseAdmin.from("app_settings").upsert({ key: "site_name", value: clean });
    await logActivity(session.accountName, "site_name_changed", null, clean);
  }

  if (maintenanceMode !== undefined) {
    await supabaseAdmin.from("app_settings").upsert({ key: "maintenance_mode", value: maintenanceMode ? "true" : "false" });
    await logActivity(session.accountName, "maintenance_mode", null, maintenanceMode ? "enabled" : "disabled");
  }

  if (announcement !== undefined) {
    const clean = String(announcement).trim().slice(0, 300);
    await supabaseAdmin.from("app_settings").upsert({ key: "announcement", value: clean });
    await logActivity(session.accountName, "announcement_changed", null, clean || "(cleared)");
  }

  return NextResponse.json({ ok: true });
}
