import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabaseAdmin
    .from("group_members")
    .select("group_id")
    .eq("account_name", session.accountName);

  const ids = (memberships ?? []).map((m) => m.group_id);
  if (ids.length === 0) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin.from("groups").select("*").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const clean = String(name ?? "").trim();
  if (!clean) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data: group, error } = await supabaseAdmin
    .from("groups")
    .insert({ name: clean, created_by: session.accountName })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("group_members")
    .insert({ group_id: group.id, account_name: session.accountName });

  return NextResponse.json(group);
}
