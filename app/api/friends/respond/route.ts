import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromAccount, accept } = await req.json();
  const from = String(fromAccount ?? "").trim().toLowerCase();
  if (!from) return NextResponse.json({ error: "fromAccount required" }, { status: 400 });

  await supabaseAdmin
    .from("friend_requests")
    .delete()
    .eq("from_account", from)
    .eq("to_account", session.accountName);

  if (accept) {
    const [a, b] = [from, session.accountName].sort();
    const { error } = await supabaseAdmin
      .from("friends")
      .insert({ account_a: a, account_b: b });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
