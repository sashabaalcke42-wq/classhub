import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.isAdmin) {
    const { data: member } = await supabaseAdmin
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("account_name", session.accountName)
      .maybeSingle();
    if (member?.role !== "admin") return NextResponse.json({ error: "Only a group admin can do that" }, { status: 403 });
  }

  const { name } = await req.json();
  const clean = String(name ?? "").trim();
  if (!clean) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("groups").update({ name: clean }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
