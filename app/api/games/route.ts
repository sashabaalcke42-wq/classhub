import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Only these file extensions get uploaded out of the zip -- keeps out
// anything that isn't part of a static browser game.
const ALLOWED_EXT = new Set([
  ".html", ".htm", ".js", ".css", ".json", ".png", ".jpg", ".jpeg", ".gif",
  ".svg", ".webp", ".mp3", ".wav", ".ogg", ".woff", ".woff2", ".ttf", ".wasm",
  ".map",
]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const file = form.get("file") as File | null;

  if (!name) return NextResponse.json({ error: "Game name required" }, { status: 400 });
  if (!file) return NextResponse.json({ error: "Zip file required" }, { status: 400 });
  if (file.size > 40 * 1024 * 1024) {
    return NextResponse.json({ error: "Zip must be under 40MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return NextResponse.json({ error: "Not a valid zip file" }, { status: 400 });
  }

  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  if (entries.length === 0) {
    return NextResponse.json({ error: "Zip is empty" }, { status: 400 });
  }

  // Detect the common root folder (many zips wrap everything in one folder)
  // so index.html can be found however the zip was packed.
  const paths = entries.map((e) => e.entryName.replace(/\\/g, "/"));
  const firstSegments = paths.map((p) => p.split("/")[0]);
  const commonRoot =
    paths.every((p) => p.startsWith(firstSegments[0] + "/")) && firstSegments[0]
      ? firstSegments[0] + "/"
      : "";

  const hasIndex = paths.some((p) => p === commonRoot + "index.html");
  if (!hasIndex) {
    return NextResponse.json(
      { error: "Zip must contain an index.html at its root (the game's entry page)" },
      { status: 400 }
    );
  }

  const gameId = crypto.randomUUID();
  const storagePath = `games/${gameId}`;

  for (const entry of entries) {
    const relPath = entry.entryName.replace(/\\/g, "/").slice(commonRoot.length);
    if (!relPath || relPath.startsWith("..")) continue;
    const ext = "." + (relPath.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;

    const { error: upErr } = await supabaseAdmin.storage
      .from("games")
      .upload(`${storagePath}/${relPath}`, entry.getData(), {
        contentType: guessType(ext),
        upsert: true,
      });
    if (upErr) {
      return NextResponse.json({ error: `Upload failed on ${relPath}: ${upErr.message}` }, { status: 500 });
    }
  }

  const { data: game, error } = await supabaseAdmin
    .from("games")
    .insert({ id: gameId, name, storage_path: storagePath, added_by: session.accountName })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(game);
}

function guessType(ext: string) {
  const map: Record<string, string> = {
    ".html": "text/html", ".htm": "text/html", ".js": "application/javascript",
    ".css": "text/css", ".json": "application/json", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
    ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg",
    ".wav": "audio/wav", ".ogg": "audio/ogg", ".wasm": "application/wasm",
  };
  return map[ext] ?? "application/octet-stream";
}
