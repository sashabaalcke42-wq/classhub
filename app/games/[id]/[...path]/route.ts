import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await params;
  const relPath = path.join("/");

  // storage_path is always exactly `games/${id}` (set at upload time), so
  // there's no need to query the database just to look that up again — this
  // used to cost a full DB round-trip on every single file a game needs
  // (HTML, then JS, then every asset), which added up fast for games split
  // across several small files.
  const { data, error } = await supabaseAdmin.storage
    .from("games")
    .download(`games/${id}/${relPath}`);

  if (error || !data) return new NextResponse("File not found", { status: 404 });

  const ext = "." + (relPath.split(".").pop() ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
