import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountName } = await req.json();
  const target = String(accountName ?? "").trim().toLowerCase();
  if (!target || target === session.accountName) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("account_name")
    .eq("account_name", target)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "No account with that name" }, { status: 404 });

  const { data: blockedByThem } = await supabaseAdmin
    .from("blocks")
    .select("*")
    .eq("blocker", target)
    .eq("blocked", session.accountName)
    .maybeSingle();
  if (blockedByThem) return NextResponse.json({ error: "Unable to send request" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("friend_requests")
    .insert({ from_account: session.accountName, to_account: target });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!error) {
    await notify(target, "friend_request", `${session.displayName} sent you a friend request`, undefined, "/dashboard/friends");
  }
  return NextResponse.json({ ok: true });
}
