import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

const ALLOWED_EXT = new Set([
  ".html", ".htm", ".js", ".css", ".json", ".png", ".jpg", ".jpeg", ".gif",
  ".svg", ".webp", ".mp3", ".wav", ".ogg", ".woff", ".woff2", ".ttf", ".wasm", ".map",
]);

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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
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
  if (entries.length === 0) return NextResponse.json({ error: "Zip is empty" }, { status: 400 });

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
  const storagePath = `store/${gameId}`;

  for (const entry of entries) {
    const relPath = entry.entryName.replace(/\\/g, "/").slice(commonRoot.length);
    if (!relPath || relPath.startsWith("..")) continue;
    const ext = "." + (relPath.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;

    const { error: upErr } = await supabaseAdmin.storage
      .from("store-games")
      .upload(`${storagePath}/${relPath}`, entry.getData(), {
        contentType: guessType(ext),
        upsert: true,
      });
    if (upErr) {
      return NextResponse.json({ error: `Upload failed on ${relPath}: ${upErr.message}` }, { status: 500 });
    }
  }

  // Admin-submitted games skip review and go live immediately at no charge
  // unless they set a price afterward from the Admin > Store tab.
  const { data: game, error } = await supabaseAdmin
    .from("store_games")
    .insert({
      id: gameId,
      name,
      description: description || null,
      storage_path: storagePath,
      submitted_by: session.accountName,
      status: session.isAdmin ? "approved" : "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(game);
}
