import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { accountName } = await req.json();
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("session_version")
    .eq("account_name", accountName)
    .single();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("users")
    .update({ session_version: (user.session_version ?? 0) + 1 })
    .eq("account_name", accountName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(session.accountName, "force_logout", accountName, null);
  return NextResponse.json({ ok: true });
}
