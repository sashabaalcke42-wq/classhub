import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; achId: string }> }) {
  const { achId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { error } = await supabaseAdmin.from("game_achievements").delete().eq("id", achId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
