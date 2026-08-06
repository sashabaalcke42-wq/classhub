import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("storage_path")
    .eq("id", params.id)
    .single();

  if (game) {
    const { data: files } = await supabaseAdmin.storage.from("games").list(game.storage_path);
    if (files && files.length) {
      await supabaseAdmin.storage
        .from("games")
        .remove(files.map((f) => `${game.storage_path}/${f.name}`));
    }
  }

  const { error } = await supabaseAdmin.from("games").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
