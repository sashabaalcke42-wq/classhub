import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WEBP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  // Unique filename every upload — a fixed name here would mean the URL
  // never changes, so browsers keep showing the old cached image forever
  // even after the file on the server is replaced.
  const path = `${session.accountName}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Clean up any previous avatar file(s) for this account now that the new
  // one is safely uploaded.
  const { data: oldFiles } = await supabaseAdmin.storage.from("avatars").list(session.accountName);
  if (oldFiles) {
    const toRemove = oldFiles
      .map((f) => `${session.accountName}/${f.name}`)
      .filter((p) => p !== path);
    if (toRemove.length) await supabaseAdmin.storage.from("avatars").remove(toRemove);
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ avatar_path: path })
    .eq("account_name", session.accountName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, path });
}
