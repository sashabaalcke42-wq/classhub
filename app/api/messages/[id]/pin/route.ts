import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: msg } = await supabaseAdmin
    .from("messages")
    .select("scope, group_id, dm_key, from_account, pinned")
    .eq("id", id)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let allowed = false;
  if (msg.scope === "global") {
    allowed = session.isAdmin;
  } else if (msg.scope === "group") {
    if (session.isAdmin) allowed = true;
    else {
      const { data: member } = await supabaseAdmin
        .from("group_members")
        .select("role")
        .eq("group_id", msg.group_id)
        .eq("account_name", session.accountName)
        .maybeSingle();
      allowed = member?.role === "admin";
    }
  } else if (msg.scope === "dm") {
    allowed = msg.dm_key?.split("__").includes(session.accountName) ?? false;
  }

  if (!allowed) return NextResponse.json({ error: "Not allowed to pin this" }, { status: 403 });

  const newPinned = !msg.pinned;
  const { error } = await supabaseAdmin
    .from("messages")
    .update({
      pinned: newPinned,
      pinned_by: newPinned ? session.accountName : null,
      pinned_at: newPinned ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, pinned: newPinned });
}
