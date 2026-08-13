import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toAccount, amount } = await req.json();
  const target = String(toAccount ?? "").trim().toLowerCase();
  const sendAmount = Math.floor(Number(amount) || 0);

  if (!target || target === session.accountName) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }
  if (sendAmount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });

  const { data: sender } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("account_name", session.accountName)
    .single();
  if (!sender || sender.credits < sendAmount) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const { data: recipient } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("account_name", target)
    .maybeSingle();
  if (!recipient) return NextResponse.json({ error: "No account with that name" }, { status: 404 });

  await supabaseAdmin.from("users").update({ credits: sender.credits - sendAmount }).eq("account_name", session.accountName);
  await supabaseAdmin.from("users").update({ credits: recipient.credits + sendAmount }).eq("account_name", target);

  await logActivity(session.accountName, "coin_transfer", target, `${sendAmount} coins`);
  return NextResponse.json({ ok: true });
}
