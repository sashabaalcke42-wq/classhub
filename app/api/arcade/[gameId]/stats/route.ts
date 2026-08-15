import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("arcade_score_log")
    .select("score")
    .eq("account_name", session.accountName)
    .eq("game_id", gameId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bestScore = data.reduce((max, r) => Math.max(max, r.score), 0);
  return NextResponse.json({ bestScore, totalPlays: data.length });
}
