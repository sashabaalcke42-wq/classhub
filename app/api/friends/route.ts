import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pairsA } = await supabaseAdmin
    .from("friends")
    .select("account_b")
    .eq("account_a", session.accountName);
  const { data: pairsB } = await supabaseAdmin
    .from("friends")
    .select("account_a")
    .eq("account_b", session.accountName);

  const friends = [
    ...(pairsA ?? []).map((p) => p.account_b),
    ...(pairsB ?? []).map((p) => p.account_a),
  ];

  const { data: incoming } = await supabaseAdmin
    .from("friend_requests")
    .select("from_account")
    .eq("to_account", session.accountName);

  const { data: outgoing } = await supabaseAdmin
    .from("friend_requests")
    .select("to_account")
    .eq("from_account", session.accountName);

  const { data: blocked } = await supabaseAdmin
    .from("blocks")
    .select("blocked")
    .eq("blocker", session.accountName);

  return NextResponse.json({
    friends,
    requests: (incoming ?? []).map((r) => r.from_account),
    outgoing: (outgoing ?? []).map((r) => r.to_account),
    blocked: (blocked ?? []).map((b) => b.blocked),
  });
}
