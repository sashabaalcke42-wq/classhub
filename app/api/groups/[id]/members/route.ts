import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select("account_name, users(display_name)")
    .eq("group_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountName } = await req.json();
  const target = String(accountName ?? "").trim().toLowerCase();
  if (!target) return NextResponse.json({ error: "accountName required" }, { status: 400 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("account_name")
    .eq("account_name", target)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "No such account" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("group_members")
    .insert({ group_id: params.id, account_name: target });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
