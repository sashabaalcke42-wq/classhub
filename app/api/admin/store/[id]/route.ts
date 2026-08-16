import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { status, price, reviewNote } = await req.json();
  const updates: Record<string, any> = {};
  if (status !== undefined) {
    if (!["pending", "approved", "rejected", "needs_changes"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }
  if (price !== undefined) updates.price = Math.max(0, parseInt(price, 10) || 0);
  if (reviewNote !== undefined) updates.review_note = reviewNote;

  const { error } = await supabaseAdmin.from("store_games").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status && ["approved", "rejected", "needs_changes"].includes(status)) {
    const { data: game } = await supabaseAdmin.from("store_games").select("submitted_by, name").eq("id", id).maybeSingle();
    if (game?.submitted_by) {
      const readable = status.replace("_", " ");
      await notify(game.submitted_by, "store_review", `Your game "${game.name}" was ${readable}`, undefined, "/dashboard/store");
    }
  }

  // The submitter never has to buy their own game — grant it free the
  // moment it's approved.
  if (status === "approved") {
    const { data: game } = await supabaseAdmin.from("store_games").select("submitted_by").eq("id", id).maybeSingle();
    if (game?.submitted_by) {
      await supabaseAdmin
        .from("store_purchases")
        .upsert({ account_name: game.submitted_by, game_id: id }, { onConflict: "account_name,game_id" });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data: game } = await supabaseAdmin
    .from("store_games")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (game) {
    const { data: files } = await supabaseAdmin.storage.from("store-games").list(game.storage_path);
    if (files && files.length) {
      await supabaseAdmin.storage.from("store-games").remove(files.map((f) => `${game.storage_path}/${f.name}`));
    }
  }

  const { error } = await supabaseAdmin.from("store_games").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
