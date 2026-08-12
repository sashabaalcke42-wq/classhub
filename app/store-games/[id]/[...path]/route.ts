import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg", ".wav": "audio/wav",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await params;
  const relPath = path.join("/");

  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { data: game } = await supabaseAdmin
    .from("store_games")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!game) return new NextResponse("Not found", { status: 404 });

  // Must own the game (or be admin) to play it.
  if (!session.isAdmin) {
    const { data: owned } = await supabaseAdmin
      .from("store_purchases")
      .select("*")
      .eq("account_name", session.accountName)
      .eq("game_id", id)
      .maybeSingle();
    if (!owned) return new NextResponse("You don't own this game", { status: 403 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("store-games")
    .download(`${game.storage_path}/${relPath}`);
  if (error || !data) return new NextResponse("File not found", { status: 404 });

  const ext = "." + (relPath.split(".").pop() ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
  });
}
