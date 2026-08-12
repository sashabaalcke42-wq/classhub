import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: games, error } = await supabaseAdmin
    .from("store_games")
    .select("id, name, description, price, submitted_by, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: owned } = await supabaseAdmin
    .from("store_purchases")
    .select("game_id")
    .eq("account_name", session.accountName);
  const ownedSet = new Set((owned ?? []).map((o) => o.game_id));

  return NextResponse.json(games.map((g) => ({ ...g, owned: ownedSet.has(g.id) })));
}
