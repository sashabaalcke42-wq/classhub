import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data: groups, error } = await supabaseAdmin.from("groups").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: members } = await supabaseAdmin.from("group_members").select("group_id");
  const counts: Record<string, number> = {};
  for (const m of members ?? []) counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;

  return NextResponse.json(
    (groups ?? []).map((g) => ({ ...g, memberCount: counts[g.id] ?? 0 }))
  );
}
