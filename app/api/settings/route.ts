import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["site_name", "announcement", "maintenance_mode"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value ?? "";
  return NextResponse.json({
    siteName: settings.site_name || "ClassHub",
    announcement: settings.announcement || "",
    maintenanceMode: settings.maintenance_mode === "true",
  });
}
