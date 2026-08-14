import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabaseAdmin
    .from("suggestion_votes")
    .select("*")
    .eq("suggestion_id", id)
    .eq("account_name", session.accountName)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("suggestion_votes").delete().eq("suggestion_id", id).eq("account_name", session.accountName);
    return NextResponse.json({ ok: true, voted: false });
  } else {
    await supabaseAdmin.from("suggestion_votes").insert({ suggestion_id: id, account_name: session.accountName });
    return NextResponse.json({ ok: true, voted: true });
  }
}
