import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: achievements, error } = await supabaseAdmin
    .from("game_achievements")
    .select("id, name, description, icon, threshold_score")
    .eq("game_id", gameId)
    .order("threshold_score", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: unlocked } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_id")
    .eq("account_name", session.accountName);
  const unlockedSet = new Set((unlocked ?? []).map((u) => u.achievement_id));

  return NextResponse.json(achievements.map((a) => ({ ...a, unlocked: unlockedSet.has(a.id) })));
}
