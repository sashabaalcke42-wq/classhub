import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No message ids provided" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("messages").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(session.accountName, "bulk_delete_messages", null, `${ids.length} messages`);
  return NextResponse.json({ ok: true, deleted: ids.length });
}
