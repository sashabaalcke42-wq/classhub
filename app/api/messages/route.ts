import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "global" | "group"
  const groupId = searchParams.get("groupId");

  if (scope === "group") {
    if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    const { data: member } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("account_name", session.accountName)
      .maybeSingle();
    if (!member && !session.isAdmin) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }
  }

  let query = supabaseAdmin.from("messages").select("*").order("created_at", { ascending: true }).limit(200);
  if (scope === "global") query = query.eq("scope", "global");
  else if (scope === "group") query = query.eq("scope", "group").eq("group_id", groupId);
  else return NextResponse.json({ error: "Invalid scope" }, { status: 400 });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scope, groupId, body } = await req.json();
  const text = String(body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  if (scope === "group") {
    if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    const { data: member } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("account_name", session.accountName)
      .maybeSingle();
    if (!member && !session.isAdmin) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }
  } else if (scope !== "global") {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      scope,
      group_id: scope === "group" ? groupId : null,
      from_account: session.accountName,
      display_name: session.displayName,
      is_admin: session.isAdmin,
      body: text,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
