import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "coins";

  if (type === "coins") {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("account_name, display_name, avatar_path, credits")
      .order("credits", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data.map((u) => ({ ...u, value: u.credits })));
  }

  if (type === "friends") {
    const { data: friendRows } = await supabaseAdmin.from("friends").select("account_a, account_b");
    const counts: Record<string, number> = {};
    for (const row of friendRows ?? []) {
      counts[row.account_a] = (counts[row.account_a] ?? 0) + 1;
      counts[row.account_b] = (counts[row.account_b] ?? 0) + 1;
    }
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("account_name, display_name, avatar_path");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ranked = users
      .map((u) => ({ ...u, value: counts[u.account_name] ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);
    return NextResponse.json(ranked);
  }

  return NextResponse.json({ error: "Unknown leaderboard type" }, { status: 400 });
}
