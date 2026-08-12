import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("game_achievements")
    .select("*")
    .eq("game_id", id)
    .order("threshold_score", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { name, description, icon, thresholdScore } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("game_achievements")
    .insert({
      game_id: id,
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon || "🏆",
      threshold_score: Math.max(0, parseInt(thresholdScore, 10) || 0),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
