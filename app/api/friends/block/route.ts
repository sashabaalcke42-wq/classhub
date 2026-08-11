import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountName } = await req.json();
  const target = String(accountName ?? "").trim().toLowerCase();
  if (!target || target === session.accountName) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  const [a, b] = [session.accountName, target].sort();
  await supabaseAdmin.from("friends").delete().eq("account_a", a).eq("account_b", b);
  await supabaseAdmin
    .from("friend_requests")
    .delete()
    .or(
      `and(from_account.eq.${session.accountName},to_account.eq.${target}),and(from_account.eq.${target},to_account.eq.${session.accountName})`
    );

  const { error } = await supabaseAdmin
    .from("blocks")
    .insert({ blocker: session.accountName, blocked: target });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
