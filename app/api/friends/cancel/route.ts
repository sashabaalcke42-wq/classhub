import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toAccount } = await req.json();
  const target = String(toAccount ?? "").trim().toLowerCase();

  const { error } = await supabaseAdmin
    .from("friend_requests")
    .delete()
    .eq("from_account", session.accountName)
    .eq("to_account", target);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
