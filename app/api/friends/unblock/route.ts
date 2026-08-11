import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountName } = await req.json();
  const target = String(accountName ?? "").trim().toLowerCase();

  const { error } = await supabaseAdmin
    .from("blocks")
    .delete()
    .eq("blocker", session.accountName)
    .eq("blocked", target);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
