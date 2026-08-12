import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: game } = await supabaseAdmin
    .from("store_games")
    .select("id, price, status")
    .eq("id", id)
    .maybeSingle();
  if (!game || game.status !== "approved") {
    return NextResponse.json({ error: "Game not available" }, { status: 404 });
  }

  const { data: existing } = await supabaseAdmin
    .from("store_purchases")
    .select("*")
    .eq("account_name", session.accountName)
    .eq("game_id", id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "You already own this game" }, { status: 409 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("account_name", session.accountName)
    .single();
  if (!user || user.credits < game.price) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const { error: purchaseErr } = await supabaseAdmin
    .from("store_purchases")
    .insert({ account_name: session.accountName, game_id: id });
  if (purchaseErr) return NextResponse.json({ error: purchaseErr.message }, { status: 500 });

  await supabaseAdmin
    .from("users")
    .update({ credits: user.credits - game.price })
    .eq("account_name", session.accountName);

  return NextResponse.json({ ok: true });
}
