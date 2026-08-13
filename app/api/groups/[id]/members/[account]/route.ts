import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

async function isGroupAdmin(groupId: string, accountName: string, siteAdmin: boolean) {
  if (siteAdmin) return true;
  const { data } = await supabaseAdmin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("account_name", accountName)
    .maybeSingle();
  return data?.role === "admin";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; account: string }> }) {
  const { id, account } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isGroupAdmin(id, session.accountName, session.isAdmin))) {
    return NextResponse.json({ error: "Only a group admin can do that" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!["member", "admin"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("group_members")
    .update({ role })
    .eq("group_id", id)
    .eq("account_name", account);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; account: string }> }) {
  const { id, account } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (account === session.accountName) {
    return NextResponse.json({ error: "Use Leave group to remove yourself" }, { status: 400 });
  }
  if (!(await isGroupAdmin(id, session.accountName, session.isAdmin))) {
    return NextResponse.json({ error: "Only a group admin can do that" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("group_members")
    .delete()
    .eq("group_id", id)
    .eq("account_name", account);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
