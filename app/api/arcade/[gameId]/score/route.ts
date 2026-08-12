import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { score } = await req.json();
  const numScore = Math.max(0, Math.floor(Number(score) || 0));

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("id, reward_rate, daily_limit, cooldown_seconds")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  // Cooldown: ignore a submission that arrives too soon after the last one.
  const { data: lastLog } = await supabaseAdmin
    .from("arcade_score_log")
    .select("created_at")
    .eq("account_name", session.accountName)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastLog) {
    const secondsSince = (Date.now() - new Date(lastLog.created_at).getTime()) / 1000;
    if (secondsSince < game.cooldown_seconds) {
      return NextResponse.json({ ok: true, coinsAwarded: 0, reason: "cooldown", newAchievements: [] });
    }
  }

  // Daily limit: cap total coins this game can pay out per user per day.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: todayLogs } = await supabaseAdmin
    .from("arcade_score_log")
    .select("coins_awarded")
    .eq("account_name", session.accountName)
    .eq("game_id", gameId)
    .gte("created_at", startOfDay.toISOString());
  const todayTotal = (todayLogs ?? []).reduce((sum, l) => sum + l.coins_awarded, 0);
  const remainingAllowance = Math.max(0, game.daily_limit - todayTotal);

  const rawCoins = Math.floor(numScore * game.reward_rate);
  const coinsAwarded = Math.min(rawCoins, remainingAllowance);

  await supabaseAdmin.from("arcade_score_log").insert({
    account_name: session.accountName,
    game_id: gameId,
    score: numScore,
    coins_awarded: coinsAwarded,
  });

  if (coinsAwarded > 0) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("account_name", session.accountName)
      .single();
    if (user) {
      await supabaseAdmin
        .from("users")
        .update({ credits: user.credits + coinsAwarded })
        .eq("account_name", session.accountName);
    }
  }

  // Unlock any achievements this score newly qualifies for.
  const { data: achievements } = await supabaseAdmin
    .from("game_achievements")
    .select("id, name, description, icon, threshold_score")
    .eq("game_id", gameId)
    .lte("threshold_score", numScore);

  const newAchievements: any[] = [];
  for (const a of achievements ?? []) {
    const { data: already } = await supabaseAdmin
      .from("user_achievements")
      .select("*")
      .eq("account_name", session.accountName)
      .eq("achievement_id", a.id)
      .maybeSingle();
    if (!already) {
      await supabaseAdmin
        .from("user_achievements")
        .insert({ account_name: session.accountName, achievement_id: a.id });
      newAchievements.push(a);
    }
  }

  return NextResponse.json({ ok: true, coinsAwarded, newAchievements });
}
