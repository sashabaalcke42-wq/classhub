import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { accountName, hours, reason } = await req.json();
  if (accountName === session.accountName) {
    return NextResponse.json({ error: "You can't ban yourself" }, { status: 400 });
  }

  // hours = 0 (or omitted) means permanent — use a far-future date.
  const bannedUntil =
    !hours || hours <= 0
      ? new Date("2999-01-01").toISOString()
      : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("users")
    .update({ banned_until: bannedUntil, ban_reason: reason || null })
    .eq("account_name", accountName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const detail = hours && hours > 0 ? `${hours}h${reason ? " — " + reason : ""}` : `permanent${reason ? " — " + reason : ""}`;
  await logActivity(session.accountName, "ban", accountName, detail);
  return NextResponse.json({ ok: true });
}
